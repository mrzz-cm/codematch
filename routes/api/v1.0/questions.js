const notificationsModule = require("../../../notifications");
const questionsModule = require("../../../questions");
const matchingModule = require("../../../matching");
const userModule = require("../../../user");

function routes (fastify, opts, done) {
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
        handler: function(request, reply) {
            const qm = questionsModule({ mongo: fastify.mongo });
            const um = userModule({ mongo: fastify.mongo });
            const mm = matchingModule({ mongo: fastify.mongo });
            const nm = notificationsModule({ mongo: fastify.mongo });

            let user;

            function updateUserCallback(err) {
                console.log((user.toJson()));
                if (err) {
                    console.log(err);
                    reply.status(500);
                    reply.send(err);
                    return;
                }

                qm.Question.retrieve(user.currentQuestion, async (err, result) => {
                    const question = qm.Question.fromJson(result);
                    new mm.Match(question).optimalHelper((err, match) => {

                        if (match === null) {
                            console.log(err);
                            reply.status(500);
                            reply.send(err);

                            // notify that there was no match
                            nm.sendUserNotification(
                                user.userId,
                                "No match was found for your problem.",
                                `basic`,
                                {
                                    notificationType: "basic"
                                },
                                (err) => {}
                            );

                            return;
                        }

                        // send notification to seeker
                        nm.sendUserNotification(
                            user.userId,
                            `You were matched with '${match.userId}`,
                            "basic",
                            {
                                notificationType: "basic"
                            },
                            (err) => {
                                if (err) {
                                    console.log(err);
                                    reply.status(500);
                                    reply.send(err);
                                    return;
                                }
                                reply.status(200);
                                reply.send("Question posted.");
                        });

                        // send notification to helper
                        nm.sendUserNotification(
                            match.userId,
                            `You have a new question from ${user.userId}`,
                            `helperMatch ${question.uuid}`,
                            {
                                notificationType: "helperMatch",
                                questionId: question.uuid
                            },
                            (err) => {
                                if (err) {
                                    console.log(`Warning: notifying helper about
                                    a new question failed!`);
                                    return;
                                }
                            }
                        );

                        // update question fields
                        question.helperNotifiedTimestamp = Date.now();
                        question.optimalHelper = match.userId;
                        question.prevCheckedHelpers.push(match.userId);
                        question.questionState = "Waiting";

                        question.update(
                            {$set: {
                                helperNotifiedTimestamp: question.helperNotifiedTimestamp,
                                optimalHelper: question.optimalHelper,
                                prevCheckedHelpers: question.prevCheckedHelpers,
                                questionState: question.questionState
                            }},
                            function(err) {
                                if (err) {
                                    console.log(err);
                                    console.log(`Warning: Failed to update question
                                    state in database after match was found!`);
                                }
                            }
                        );

                        // update helper fields
                        um.User.retrieve(match.userId, (err, data) => {
                            if (err) {
                                 console.log(err);
                                 console.log(`Warning: Failed to retrieve helper
                                 for question!`);
                                 return;
                            }

                            const optimalHelper = um.User.fromJson(data);
                            optimalHelper.currentQuestion = question.uuid;
                            // update database
                            optimalHelper.update({$set: 
                                {
                                    currentQuestion: optimalHelper.currentQuestion
                                }
                            }, (err) => {
                                if (err) {
                                    console.log(err);
                                    console.log(`Warning: Failed to set helper's fields
                                    when they were selected for a question`);
                                }
                            });
                        });
                    });
                });
            }

            function createQuestionCallback(err, status, new_question) {
                if (err || !new_question) {
                    reply.status(status);
                    reply.send(err);
                    return;
                }

                // put the question into the database
                new_question.create(function(err) {
                    if (err) {
                        reply.status(500);
                        reply.send(err);
                        return;
                    }

                    // set the user's current question
                    user.currentQuestion = new_question.uuid;
                    user.questionsPosted.push(new_question.uuid);

                    // update the user
                    user.update({$set: 
                        {
                            currentQuestion: new_question.uuid,
                            questionsPosted: user.questionsPosted
                        }
                    }, updateUserCallback);
                });
            }

            function getUserCallback(err, result) {
                if (err || !result) {
                    reply.status(500);
                    reply.send(err);
                    return;
                }

                // check that the user can post the question
                user = um.User.fromJson(result);

                if (user.currentQuestion) {
                    reply.status(401);
                    reply.send("Cannot post a question when you are already " +
                               "registered to another question!");
                    return;
                }

                // create the question
                qm.createQuestion(request.body, createQuestionCallback);
            }

            function userExistsCallback(userExists) {
                if (userExists) {
                    // get the user
                    um.User.retrieve(request.body.userId, getUserCallback);
                } else {
                    reply.status(400);
                    reply.send("Provided user doesn't exist.");
                }
            }

            um.User.exists(request.body.userId)
                .then(userExistsCallback)
                .catch(err => {
                    reply.status(400);
                    reply.send(err);
                });
        }
    });

    fastify.route({
        method: "GET",
        url: "/:questionId",
        preValidation: [ fastify.authenticate ],
        handler: function(request, reply) {
            const qm = questionsModule({ mongo: fastify.mongo });

            qm.getQuestion(request.params.questionId, function(err, data) {
                if (err || !data) {
                    reply.status(400);
                    reply.send(err);
                    return;
                }

                reply.status(200);
                reply.send(data);
            });
        }
    });

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
        handler: function(request, reply) {
            const nm = notificationsModule({ mongo: fastify.mongo });
            const qm = questionsModule({ mongo: fastify.mongo });
            const um = userModule({ mongo: fastify.mongo });

            // TODO: add more security checks

            function getHelperCallback(err, data) {
                if (err) {
                    console.log(err);
                    return;
                }

                if (!data) {
                    console.log(err);
                    return;
                }

                // update helper
                const user = um.User.fromJson(data);
                user.questionsHelped.push(request.body.questionId);

                user.update(
                    {$set: {
                        currentQuestion: request.body.questionId,
                        questionsHelped: user.questionsHelped
                    }},
                    (err) => {
                        if (err) {
                            console.log(err);
                        }
                    }
                );
            }

            qm.Question.retrieve(request.body.questionId, (err, q) => {
                if (err) {
                    reply.status(400);
                    reply.send(err);
                    return;
                }

                if (q.seeker == request.body.userId) {
                    reply.status(400);
                    reply.send("Cannot accept your own question.");
                }

                qm.Question.fromJson(q).update({
                    $set:
                        {
                            helperAccepted: true,
                            finalHelper: request.body.userId,
                            questionState: "Matched"
                        }
                }, (err) => {
                    if (err) {
                        reply.status(400);
                        reply.send(err);
                        return;
                    }
                    
                    nm.sendUserNotification(q.seeker, `Helper for ${q.title} accepted: 
                    ${q.optimalHelper}`,
                    `basic`, {}, (err, result) => {
                        if (err) {
                            reply.status(400);
                            reply.send(err);
                            return;
                        }

                        reply.status(200);
                        reply.send("Found match");
                    });

                    // update the helper
                    um.User.retrieve(q.optimalHelper, getHelperCallback);
                });
            });
        }
    });

    fastify.route({
        method: "POST",
        url: "/close/:seekerId",
        schema: {
            body: {
                type: "object",
                required: ["rating"],
                properties: {
                    rating: { type: "string" },
                }
            }
        },
        preValidation: [ fastify.authenticate ],
        handler: function(request, reply) {
            const um = userModule({ mongo: fastify.mongo });
            const qm = questionsModule({ mongo: fastify.mongo });
            const rating = request.body.rating;
            const seekerId = request.params.seekerId;

            // TODO: If seeker matches

            um.User.retrieve(seekerId, (err, u) => {
                if (errCheck(reply, err)) return;

                const seeker = um.User.fromJson(u);

                if (seeker.currentQuestion == null) {
                    reply.status(400);
                    reply.send(
                        `Seeker '${seeker.userId} doesn't` +
                        " have an open question.");
                    return;
                }

                // clear the seeker's question
                seeker.update(
                    {$set: {
                        currentQuestion: null
                    }},
                    (err) => {
                        if (err) {
                            reply.status(400);
                            reply.send(err);
                            return;
                        }

                        qm.Question.retrieve(seeker.currentQuestion, (err, qJson) => {

                            if ((rating < 1) || (rating > 10)) {
                                reply.status(400);
                                reply.send(`Points '${rating} is not withing range 1-10`);
                                return;
                            }
        
                            if (errCheck(reply, err)) return;
        
                            um.User.retrieve(qJson.finalHelper, (err, hJson) => {
                                if (errCheck(reply, err)) return;
        
                                const helper = um.User.fromJson(hJson);
        
                                helper.update(
                                    {
                                        $set: {
                                            points: (helper.points + rating),
                                            currentQuestion: null
                                        }
                                    }, (err) => {
                                        if (errCheck(reply, err)) return;
        
                                        reply.status(200);
                                        reply.send(`Rated user ${helper.userId}`);
                                    });
                            });
                        });
                    }
                );
            });
        }
    });

    done();
}

function errCheck(reply, err) {
    reply.status(400);
    reply.send(err);
    return err;
}

module.exports = routes;
