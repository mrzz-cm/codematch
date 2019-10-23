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
                            return;
                        }

                        nm.sendUserNotification(
                            match.user.userId,
                            "You were matched",
                            `You were matched with '${question.seeker}`,
                            result, (err) => {
                                if (err) {
                                    console.log(err);
                                    reply.status(500);
                                    reply.send(err);
                                    return;
                                }
                                reply.status(200);
                                reply.send("Question posted.");
                            })
                    })
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

    done();
}

module.exports = routes;
