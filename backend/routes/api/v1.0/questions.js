const questionsModule = require("../../../questions");
const matchingModule = require("../../../matching");
const userModule = require("../../../user");
const ru = require("../../../utils/router");

const rc = ru.responseCodes;

function routes (fastify, opts, done) {

    /* POST Requests */

    /**
     * POST - Create a new question
     */
    fastify.route({
        method: "POST",
        url: "/create",
        schema: {
            body: {
                type: "object",
                required: ["userId", "title", "courseCode", "questionText"],
                properties: {
                    userId: { type: "string" },
                    title: { type: "string" },
                    courseCode: { type: "string" },
                    questionText:  { type: "string" }
                }
            }
        },
        preValidation: [ fastify.authenticate ],
        handler: async (request, reply) => {
            const qm = questionsModule({ mongo: fastify.mongo });
            const um = userModule({ mongo: fastify.mongo });
            const mm = matchingModule({ mongo: fastify.mongo });

            const body = request.body;

            let userExists;
            try {
                userExists = await um.User.exists(request.body.userId);
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) return;
            }

            if (!userExists) {
                reply.status(rc.BAD_REQUEST);
                reply.send("Provided user doesn't exist.");
                return;
            }

            let uJson;
            try {
                uJson = await um.User.retrieve(request.body.userId);
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) return;
            }

            if (!uJson) {
                reply.status(rc.INTERNAL_SERVER_ERROR);
                reply.send(`No user ${request.body.userId} found`);
                return;
            }

            // check that the user can post the question
            const user = um.User.fromJson(uJson);

            if (user.currentQuestion) {
                reply.status(401);
                reply.send(
                    "Cannot post a question when you are already " +
                    "registered to another question!");
                return;
            }

            // create the question
            let q;
            try {
                q = await qm.Question.newQuestion(
                    body.userId,
                    body.title,
                    body.courseCode,
                    body.questionText
                );
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) return;
            }

            if (!q) {
                reply.status(rc.INTERNAL_SERVER_ERROR);
                reply.send(`No question found in user ${body.userId}`);
                return;
            }

            // put the question into the database
            try {
                await q.create();
            } catch (e) {
                if (ru.errCheck(reply, rc.INTERNAL_SERVER_ERROR, e)) return;
            }

            // set the user's current question
            user.currentQuestion = q.uuid;
            user.questionsPosted.push(q.uuid);

            // update the user
            try {
                await user.update({$set:
                        {
                            currentQuestion: q.uuid,
                            questionsPosted: user.questionsPosted
                        }
                });
            } catch (e) {
                if (ru.errCheck(reply, rc.INTERNAL_SERVER_ERROR, e)) return;
            }

            let uQuestion;
            try {
                uQuestion = await qm.Question.retrieve(user.currentQuestion);
            } catch (e) {
                if (ru.errCheck(reply, rc.INTERNAL_SERVER_ERROR, e)) return;
            }

            const question = qm.Question.fromJson(uQuestion);

            let match;
            try {
                match = await new mm.Match(question).optimalHelper();
            } catch (e) {
                reply.status(rc.INTERNAL_SERVER_ERROR);
                reply.send(e);

                // notify that there was no match
                await um.User.sendNotification(
                    user.userId,
                    "No match was found for your problem.",
                    "basic",
                    {
                        notificationType: "basic"
                    });
            }

            // send notification to seeker
            try {
                await um.User.sendNotification(
                    user.userId,
                    `You were matched with '${match.userId}`,
                    "basic",
                    {
                        notificationType: "basic"
                    });

            } catch (e) {
                request.log.info(e);
                if (ru.errCheck(reply, rc.INTERNAL_SERVER_ERROR, e)) return;
            }

            // send notification to helper
            try {
                await um.User.sendNotification(
                    match.userId,
                    `You have a new question from ${user.userId}`,
                    `helperMatch ${question.uuid}`,
                    {
                        notificationType: "helperMatch",
                        questionId: question.uuid
                    });

            } catch (e) {
                request.log.info("Warning: notifying helper " +
                    "about a new question failed!");
            }

            // update question fields
            question.helperNotifiedTimestamp = Date.now();
            question.optimalHelper = match.userId;
            question.prevCheckedHelpers.push(match.userId);
            question.questionState = "Waiting";

            try {
                await question.update(
                    {$set: {
                        helperNotifiedTimestamp: question.helperNotifiedTimestamp,
                        optimalHelper: question.optimalHelper,
                        prevCheckedHelpers: question.prevCheckedHelpers,
                        questionState: question.questionState
                    }});
            } catch(e) {
                request.log.info(e);
                request.log.info("Warning: Failed to update question " +
                    "state in database after match was found!");
            }


            // update helper fields
            let hJson;
            try {
                hJson = await um.User.retrieve(match.userId);
            } catch (e) {
                request.log.info(e);
                request.log.info("Warning: Failed to retrieve helper " +
                    "for question!");
                return;
            }

            const optimalHelper = um.User.fromJson(hJson);
            optimalHelper.currentQuestion = question.uuid;

            // update database
            optimalHelper.update({$set:
                    {
                        currentQuestion: optimalHelper.currentQuestion
                    }
            }).catch((err) => {
                request.log.info(err);
                request.log.info(
                    "Warning: Failed to set helper's fields " +
                        "when they were selected for a question");
            }
            );

            reply.status(rc.OK);
            reply.send({ msg: `Created question ${q.uuid}`});
        }
    });

    /**
     * POST - Accept a question as a helper
     */
    fastify.route({
        method: "POST",
        url: "/accept",
        schema: {
            body: {
                type: "object",
                required: ["userId", "questionId"],
                properties: {
                    userId: { type: "string" },
                    questionId: { type: "string" },
                }
            }
        },
        preValidation: [ fastify.authenticate ],
        handler: async (request, reply) => {
            const qm = questionsModule({ mongo: fastify.mongo });
            const um = userModule({ mongo: fastify.mongo });

            const userId = request.body.userId;
            const questionId = request.body.questionId;

            // TODO: add more security checks

            let qJson;
            try {
                qJson = await qm.Question.retrieve(questionId);
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) return;
            }

            if (qJson.seeker === userId) {
                reply.status(rc.BAD_REQUEST);
                reply.send("Cannot accept your own question.");
            }

            try {
                await qm.Question.fromJson(qJson).update({
                    $set:
                        {
                            helperAccepted: true,
                            finalHelper: request.body.userId,
                            questionState: "Matched"
                        }
                });
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) return;
            }

            try {
                await um.User.sendNotification(
                    qJson.seeker,
                    `Helper for ${qJson.title} accepted: 
                    ${qJson.optimalHelper}`,
                    "basic", {}
                );
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) return;
            }

            reply.status(rc.OK);
            reply.send({ msg: `${userId} accepted ${questionId}` });

            // update the helper
            let helper;
            try {
                helper = await um.User.retrieve(qJson.optimalHelper);
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) return;
            }

            if (!helper) {
                request.log.info("No helper found");
                return;
            }

            // update helper
            const user = um.User.fromJson(helper);
            user.questionsHelped.push(questionId);

            user.update( {
                $set: {
                    currentQuestion: questionId,
                    questionsHelped: user.questionsHelped
                }
            })
                .catch(request.log.info);
        }
    });

    /**
     * POST - Close a question as a seeker
     */
    fastify.route({
        method: "POST",
        url: "/close/:seekerId",
        schema: {
            body: {
                type: "object",
                required: ["rating"],
                properties: {
                    rating: { type: "number" },
                }
            }
        },
        preValidation: [ fastify.authenticate ],
        handler: async (request, reply) => {
            const um = userModule({ mongo: fastify.mongo });
            const qm = questionsModule({ mongo: fastify.mongo });
            const rating = request.body.rating;
            const seekerId = request.params.seekerId;

            if ((rating < 1) || (rating > 10)) {
                reply.status(rc.BAD_REQUEST);
                reply.send({
                    msg: `Points '${rating} is not withing range 1-10`
                });
                return;
            }

            // TODO: If seeker matches

            let uJson;
            try {
                uJson = await um.User.retrieve(seekerId);
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) return;
            }

            const seeker = um.User.fromJson(uJson);

            if (seeker.currentQuestion == null) {
                reply.status(rc.BAD_REQUEST);
                reply.send(
                    `Seeker '${seeker.userId} doesn't` +
                    " have an open question.");
                return;
            }

            let qJson;
            try {
                qJson = await qm.Question.retrieve(seeker.currentQuestion);
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) return;
            }

            let hJson;
            try {
                hJson = await um.User.retrieve(qJson.finalHelper);
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) return;
            }

            const helper = um.User.fromJson(hJson);
            fastify.log.info(uJson);

            // update helper's points
            try {
                await helper.update(
                    {
                        $set: {
                            points: (helper.points + rating),
                            currentQuestion: null
                        }
                    });
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) return;
            }

            // clear the seeker's question
            try {
                await seeker.update({ $set: { currentQuestion: null }});
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) return;
            }

            // set the status of the question to "Resolved"
            const question = qm.Question.fromJson(qJson);
            try {
                await question.update(
                    {
                        $set: {
                            finalScore: rating,
                            questionState: "Resolved"
                        }
                    }
                );
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) return;
            }

            reply.status(rc.OK);
            reply.send(`Rated user ${helper.userId}`);

        }
    });

    /* GET Requests */

    /**
     * GET question data by UUID
     */
    fastify.route({
        method: "GET",
        url: "/:questionId",
        preValidation: [ fastify.authenticate ],
        handler: async (request, reply) => {
            const qm = questionsModule({ mongo: fastify.mongo });

            let q;
            try {
                q = await qm.Question.retrieve(request.params.questionId);
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) return;
            }

            fastify.log.info(q);

            if (!q) {
                reply.status(rc.BAD_REQUEST);
                reply.send("No question found");
                return;
            }

            reply.status(rc.OK);
            reply.send(q);
        }
    });

    done();
}

module.exports = routes;
