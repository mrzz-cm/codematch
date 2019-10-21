const questionsModule = require("../../../questions");
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



            // qm.createQuestion(request.body, function(err, status, q) {
            //     if (err || (status !== 200) || !q) {
            //         console.log(q);
            //         reply.status(status);
            //         reply.send(err);
            //         return
            //     }

            //     // add it to the database
            //     console.log(q.toJson());

            //     // done
            //     reply.status(200);
            //     reply.send('Question posted.');
            // });
            let user;

            function updateUserCallback(err, newUserJson) {
                user = um.User.fromJson(newUserJson);
                if (err) {
                    console.log(err);
                    reply.status(500);
                    reply.send(err);
                    return;
                }

                reply.status(200);
                reply.send("yes");
            }

            function createQuestionCallback(err, status, new_question) {
                if (err || !new_question) {
                    reply.status(status);
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

    done();
}

module.exports = routes;
