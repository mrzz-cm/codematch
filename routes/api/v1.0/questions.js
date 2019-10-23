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

            // TODO: add more security checks

            qm.Question.retrieve(request.body.questionId, (err, q) => {
                if (err) {
                    reply.status(400);
                    reply.send(err);
                    return;
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
                    
                    nm.sendUserNotification(q.seeker, `Found for ${q.title}`,
                    `basic`, {}, (err, result) => {
                        if (err) {
                            reply.status(400);
                            reply.send(err);
                            return;
                        }

                        reply.status(200);
                        reply.send("Found match");
                    });
                });
            });
        }
    });

    fastify.route({
        method: "POST",
        url: "/rate/:userId",
        schema: {
            body: {
                type: "object",
                required: ["seekerId", "rating"],
                properties: {
                    seekerId: { type: "string" },
                    rating: { type: "number" },
                }
            }
        },
        preValidation: [ fastify.authenticate ],
        handler: function(request, reply) {
            const um = userModule({ mongo: fastify.mongo });
            const points = request.body.rating;

            // TODO: If seeker matches

            if ((points < 1) || (points > 10)) {
                reply.status(400);
                reply.send(`Points '${points} is not withing range 1-10`);
                return;
            }

            um.User.retrieve(request.params.userId, (err, u) => {
                if (err) {
                    reply.status(400);
                    reply.send(err);
                    return;
                }

                um.User.fromJson(u).update(
                    {
                        $set: {
                            points: (u.points + points)
                        }
                    }, (err) => {
                        if (err) {
                            reply.status(400);
                            reply.send(err);
                            return;
                        }
                        reply.status(200);
                        reply.send(`Rated user ${request.query.userId}`);
                    });
            });
        }
    });

    done();
}

module.exports = routes;
