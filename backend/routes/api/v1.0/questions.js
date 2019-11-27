const questionsModule = require("../../../questions");
const auth = require("../../../authentication");
const matchingModule = require("../../../matching");
const multerModule = require("../../../multer");
const userModule = require("../../../user");
const ru = require("../../../utils/router");
const config = require("../../../config");

const rc = ru.responseCodes;

const upload = multerModule.multer({
    limits: { fileSize:  config.fileSettings.maxFileSize },
    storage: multerModule.storageHandler
});

const qUploadHandler = upload.fields([
    {
        name: "questionImage",
        maxCount: 2
    }
]);

async function matchQuestion(request, reply, fastify, question, seeker) {
    const um = userModule({ mongo: fastify.mongo });
    const mm = matchingModule({ mongo: fastify.mongo });

    let match;
    try {
        match = await new mm.Match(question).optimalHelper();
    } catch (e) {
        reply.status(rc.INTERNAL_SERVER_ERROR);
        reply.send(e);

        // notify that there was no match
        await um.User.sendNotification(
            seeker.userId,
            "No match was found for your problem.",
            "basic",
            {
                notificationType: "basic"
            });
        
        return false;
    }

    request.log.info(`match: ${match.userId}`);

    request.log.info("Sending the notification to ", seeker.userId);

    // send notification to seeker
    try {
        await um.User.sendNotification(
            seeker.userId,
            `You were matched with '${match.userId}`,
            "basic",
            {
                notificationType: "basic"
            });

    } catch (e) {
        request.log.info(e);
        if (ru.errCheck(reply, rc.INTERNAL_SERVER_ERROR, e)) {return false;}
    }

    request.log.info("Sending the notification to ", match.userId);

    // send notification to helper
    try {
        await um.User.sendNotification(
            match.userId,
            `You have a new question from ${seeker.userId}`,
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
    /* eslint-disable require-atomic-updates */
    question.helperNotifiedTimestamp = Date.now();
    question.optimalHelper = match.userId;
    question.prevCheckedHelpers.push(match.userId);
    question.questionState = "Waiting";
    /* eslint-enable require-atomic-updates */

    request.log.info("Updating question");

    try {
        await question.update(
            {
                $set: {
                    helperNotifiedTimestamp: question.helperNotifiedTimestamp,
                    optimalHelper: question.optimalHelper,
                    prevCheckedHelpers: question.prevCheckedHelpers,
                    questionState: question.questionState
                }
            });
    } catch (e) {
        request.log.info(e);
        request.log.info("Warning: Failed to update question " +
            "state in database after match was found!");
    }

    // update matched helper fields
    request.log.info("Fetching matched helper ", match.userId);

    let helper;
    try {
        helper = await um.User.retrieve(match.userId);
    } catch (e) {
        request.log.info(e);
        request.log.info("Couldn't find the helper!");

        reply.status(rc.INTERNAL_SERVER_ERROR);
        reply.send();

        return false;
    }

    if (!helper) {
        reply.status(rc.INTERNAL_SERVER_ERROR);
        reply.send();

        return false;
    }

    const helperUser = um.User.fromJson(helper);

    request.log.info("Updating matched helper data");

    try {
        await helperUser.update({
            $set:
                {
                    currentMatchedQuestion: question.uuid
                }
        });
    } catch (e) {
        if (ru.errCheck(reply, rc.INTERNAL_SERVER_ERROR, e)) {return false;}
    }

    return true;
}

function routes (fastify, opts, done) {

    async function validateUser(fastify, userModule, request, userId, reply) {
        let userExists;
        try {
            /* eslint-disable-next-line */
            userExists = await userModule.User.exists(userId);
        } catch (e) {
            if (ru.errCheck(reply, rc.BAD_REQUEST, e)) {
                return false;
            }
        }

        if (!userExists) {
            reply.status(rc.BAD_REQUEST);
            reply.send({ msg: `Provided user ${userId} doesn't exist.` });
            return false;
        }

        if (!auth.verifyUserToken(fastify, request, userId)) {
            ru.errCheck(reply, rc.UNAUTHORIZED, "Invalid credentials.");
            return false;
        }

        return true;
    }

    /* POST Requests */

    /**
     * POST - Create a new question
     */
    fastify.route({
        method: "POST",
        url: "/create",
        schema: {
            body: {
                required: ["userId", "title", "courseCode", "questionText"],
                properties: {
                    userId: { type: "string" },
                    title: { type: "string" },
                    courseCode: { type: "string" },
                    questionText:  { type: "string" },
                }
            }
        },
        preHandler: qUploadHandler,
        preValidation: [ fastify.authenticate ],
        async handler(request, reply) {
            const qm = questionsModule({ mongo: fastify.mongo });
            const um = userModule({ mongo: fastify.mongo });

            const body = request.body;

            let images = [];
            if (!(typeof request.files === "undefined" || (request.files === null))) {
                images = request.files.questionImage || [];
            }

            const imagePaths = images.map((i) => i.path);

            if (!await validateUser(fastify, um, request, body.userId, reply)) {
                return;
            }

            let uJson;
            try {
                uJson = await um.User.retrieve(body.userId);
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) {return;}
            }

            if (!uJson) {
                reply.status(rc.INTERNAL_SERVER_ERROR);
                reply.send(`No user ${body.userId} found`);
                return;
            }

            // check that the user can post the question
            const user = um.User.fromJson(uJson);

            if (user.currentQuestion != null || user.currentMatchedQuestion !== null) {
                reply.status(rc.UNAUTHORIZED);
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
                    body.questionText,
                    imagePaths
                );
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) {return;}
            }

            if (!q) {
                reply.status(rc.BAD_REQUEST);
                reply.send(`No question found in user ${body.userId}`);
                return;
            }

            // put the question into the database
            try {
                await q.create();
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) {return;}
            }

            // set the user's current question
            user.currentQuestion = q.uuid;
            user.questionsPosted.push(q.uuid);

            // update the user
            try {
                await user.update({
                    $set:
                        {
                            currentQuestion: q.uuid,
                            questionsPosted: user.questionsPosted
                        }
                });
            } catch (e) {
                if (ru.errCheck(reply, rc.INTERNAL_SERVER_ERROR, e)) {return;}
            }

            let uQuestion;
            try {
                uQuestion = await qm.Question.retrieve(user.currentQuestion);
            } catch (e) {
                if (ru.errCheck(reply, rc.INTERNAL_SERVER_ERROR, e)) {return;}
            }

            const question = qm.Question.fromJson(uQuestion);

            request.log.info(question);

            // run matching algorithm
            const matchSuccess = await matchQuestion(
                request, reply, fastify, question, user);
            if (!matchSuccess) { return; }

            request.log.info("New question matched: ", question);

            reply.status(rc.OK);
            reply.send({
                msg: `Created question ${q.uuid}`,
                uuid: q.uuid
            });
        }
    });

    /**
     * POST - delete a pending question as a seeker
     */
    fastify.route({
        method: "POST",
        url: "/delete/:seekerId",
        preValidation: [ fastify.authenticate ],
        async handler (request, reply) {
            const um = userModule({ mongo: fastify.mongo });
            const qm = questionsModule({ mongo: fastify.mongo });
            const seekerId = request.params.seekerId;

            if (!await validateUser(fastify, um, request, seekerId, reply)) {
                return;
            }

            let uJson;
            try {
                uJson = await um.User.retrieve(seekerId);
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) {return;}
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
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) {return;}
            }
            const question = qm.Question.fromJson(qJson);

            if (question.seeker !== seekerId) {
                reply.status(rc.UNAUTHORIZED);
                reply.send("Unauthorized to delete this question.");
                return;
            }

            const qState = question.questionState;

            if ((qState !== "Waiting") && (qState !== "Unmatched")) {
                reply.status(rc.BAD_REQUEST);
                reply.send("Cannot close this question.");
            }

            const helperWaiting = (question.questionState === "Waiting");

            // close the question
            question.questionState = "Resolved";
            try {
                await question.update(
                    {
                        $set: {
                            questionState: "Resolved",
                        }
                    });
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) {return;}
            }

            // free up seeker's currentQuestion
            seeker.currentQuestion = null;
            try {
                await seeker.update(
                    {
                        $set: {
                            currentQuestion: null,
                        }
                    }
                );
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) {return;}
            }

            reply.status(rc.OK);
            reply.send("Closed question.");

            if (helperWaiting) {
                // update the helper we are waiting for a response from
                let hJson;
                try {
                    hJson = await um.User.retrieve(qJson.optimalHelper);
                } catch (e) {
                    if (ru.errCheck(reply, rc.BAD_REQUEST, e)) {return;}
                }

                const helper = um.User.fromJson(hJson);

                // free up the helper's matched question
                try {
                    await helper.update({
                        $set:
                            {
                                currentMatchedQuestion: null
                            }
                    });
                } catch (e) {
                    request.log.info("Warning: unable to clear helper's " + 
                        "current matched question!");
                }

                try {
                    await um.User.sendNotification(
                        helper.userId,
                        `${seeker.userId} closed their question.`,
                        "basic",
                        {
                            notificationType: "basic"
                        });
                } catch (e) {
                    request.log.info("Warning: notifying helper " +
                        "about a deleted question failed!");
                }
            }
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
        async handler(request, reply) {
            const qm = questionsModule({ mongo: fastify.mongo });
            const um = userModule({ mongo: fastify.mongo });

            const userId = request.body.userId;
            const questionId = request.body.questionId;

            // check user exists and provided valid credentials
            if (!await validateUser(fastify, um, request, userId, reply)) {
                return;
            }

            // retrieve question information
            let qJson;
            try {
                qJson = await qm.Question.retrieve(questionId);
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) {return;}
            }

            if (qJson.optimalHelper !== userId) {
                reply.status(rc.UNAUTHORIZED);
                reply.send("Not authorized to accept this question.");
                return;
            }

            if (qJson.questionState !== "Waiting") {
                reply.status(rc.UNAUTHORIZED);
                reply.send("Not authorized to accept this question.");
                return;
            }

            let helperJson;
            try {
                helperJson = await um.User.retrieve(userId);
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) {return;}
            }

            if (!helperJson) {
                request.log.info("No helper found");
                return;
            }

            if (helperJson.currentQuestion !== null) {
                reply.status(rc.UNAUTHORIZED);
                reply.send("Cannot accept a question when you already have an active one.");
                return;
            }

            if (helperJson.currentMatchedQuestion !== qJson.uuid ) {
                reply.status(rc.UNAUTHORIZED);
                reply.send("Not authorized to accept this question.");
                return;
            }

            const helper = um.User.fromJson(helperJson);

            // now we can actually update the database
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
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) {return;}
            }

            try {
                await um.User.sendNotification(
                    qJson.seeker,
                    `Helper for ${qJson.title} accepted: 
                    ${qJson.optimalHelper}`,
                    "basic", {}
                );
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) {return;}
            }

            reply.status(rc.OK);
            reply.send({ msg: `${userId} accepted ${questionId}` });

            // update the helper
            helper.currentMatchedQuestion = questionId;
            helper.questionsHelped.push(questionId);

            helper.update( {
                $set: {
                    currentMatchedQuestion: questionId,
                    questionsHelped: helper.questionsHelped
                }
            })
                .catch(request.log.info);
        }
    });

    /**
     * POST - decline a question as a helper
     */
    fastify.route({
        method: "POST",
        url: "/decline",
        schema: {
            body: {
                type: "object",
                required: ["userId", "questionId"],
                properties: {
                    userId: { type: "string" },
                    questionId: { type: "string" }
                }
            }
        },
        preValidation: [ fastify.authenticate ],
        async handler(request, reply) {
            const qm = questionsModule({ mongo: fastify.mongo });
            const um = userModule({ mongo: fastify.mongo });

            const userId = request.body.userId;
            const questionId = request.body.questionId;

            if (!await validateUser(fastify, um, request, userId, reply)) {
                return;
            }

            // retrieve question information
            let qJson;
            try {
                qJson = await qm.Question.retrieve(questionId);
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) {return;}
            }

            if ((qJson.optimalHelper !== userId) ||
                (qJson.questionState !== "Waiting")) {
                reply.status(rc.UNAUTHORIZED);
                reply.send({
                    msg: "Not authorized to decline this question.",
                    userId,
                    optimalHelper: qJson.optimalHelper,
                    questionState: qJson.questionState,
                });
                return;
            }

            // update question fields
            const question = qm.Question.fromJson(qJson);
            question.helperAccepted = false;
            question.optimalHelper = null;
            question.questionState = "Unmatched";

            try {
                await question.update({
                    $set:
                        {
                            helperAccepted: false,
                            optimalHelper: null,
                            questionState: "Unmatched"
                        }
                });
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) {return;}
            }

            // retrieve helper (sender of this request) user
            let helperJson;
            try {
                helperJson = await um.User.retrieve(userId);
            } catch (e) {
                if (ru.errCheck(reply, rc.INTERNAL_SERVER_ERROR, e)) { return; }
            }

            if (!helperJson) {
                reply.status(rc.INTERNAL_SERVER_ERROR);
                reply.send(`No user ${userId} found`);
                return;
            }

            const helperUser = um.User.fromJson(helperJson);

            // free up the helper's matched question
            try {
                await helperUser.update({
                    $set:
                        {
                            currentMatchedQuestion: null
                        }
                });
            } catch (e) {
                request.log.info("Warning: unable to clear helper's " + 
                    "current matched question!");
                reply.status(rc.INTERNAL_SERVER_ERROR);
                reply.send();
                return;
            }

            // retrieve seeker (poster of question) information
            let uJson;
            try {
                uJson = await um.User.retrieve(question.seeker);
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) { return; }
            }

            if (!uJson) {
                reply.status(rc.INTERNAL_SERVER_ERROR);
                reply.send(`No user ${question.seeker} found`);
                return;
            }
            const seeker = um.User.fromJson(uJson);

            // notify the seeker helper declined
            try {
                await um.User.sendNotification(
                    qJson.seeker,
                    `Helper for ${qJson.title} (${qJson.optimalHelper}) declined.
                    Rematching...`,
                    "basic", {}
                );
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) {return;}
            }

            // run matching algorithm again
            const matchSuccess = await matchQuestion(request, reply, fastify, question, seeker);
            if (!matchSuccess) { return; }

            reply.status(rc.OK);
            reply.send({ msg: `${userId} declined ${questionId}` });
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
        async handler(request, reply) {
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

            if (!await validateUser(fastify, um, request, seekerId, reply)) {
                return;
            }

            let uJson;
            try {
                uJson = await um.User.retrieve(seekerId);
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) {return;}
            }

            const seeker = um.User.fromJson(uJson);

            if (seeker.currentQuestion == null) {
                reply.status(rc.BAD_REQUEST);
                reply.send({
                    msg: `Seeker '${seeker.userId} doesn't` +
                        " have an open question."
                });
                return;
            }

            let qJson;
            try {
                qJson = await qm.Question.retrieve(seeker.currentQuestion);
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) {return;}
            }

            let hJson;
            try {
                hJson = await um.User.retrieve(qJson.finalHelper);
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) {return;}
            }

            const helper = um.User.fromJson(hJson);
            fastify.log.info(uJson);

            // update helper's points and clear their question
            try {
                await helper.update(
                    {
                        $set: {
                            points: (helper.points + rating),
                            currentMatchedQuestion: null
                        }
                    });
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) {return;}
            }

            // clear the seeker's question
            try {
                await seeker.update({ $set: { currentQuestion: null }});
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) {return;}
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
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) {return;}
            }

            reply.status(rc.OK);
            reply.send({ msg: `Rated user ${helper.userId}` });
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
        async handler(request, reply) {
            const qm = questionsModule({ mongo: fastify.mongo });

            let q;
            try {
                q = await qm.Question.retrieve(request.params.questionId);
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) {return;}
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
