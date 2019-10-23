const authentication = require("../../../authentication");
const notificationsModule = require("../../../notifications");
const userModule = require("../../../user");

function routes (fastify, opts, done) {
    fastify.route({
        method: "POST",
        url: "/register",
        schema: {
            body: {
                type: "object",
                required: ["access_token"],
                properties: {
                    access_token: { type: "string" }
                }
            }
        },
        preValidation: [ fastify.authenticate ],
        handler: function(request, reply) {
            const um = userModule({ mongo: fastify.mongo });
            const nm = notificationsModule({ mongo: fastify.mongo });
            console.log(request.body);

            authentication.requestEmail(request.body.access_token, async function (err, res, data) {
                if (err || (res.statusCode !== 200) || !data.email) {
                    console.log(data);
                    reply.status(res.statusCode);
                    reply.send(err);
                    return;
                }

                const userExists = await um.User.exists(data.email);

                if (userExists) {
                    reply.status(500);
                    reply.send("User exists");
                    return;
                }

                // store to database
                um.User.newUser(data.email).create((err) => {
                    if (err) {
                        reply.status(500);
                        reply.send(err);
                        return;
                    }
                    // done
                    reply.status(200);
                    reply.send();

                    nm.sendUserNotification(
                        data.email,
                        "Authenticated",
                        `You were mauthenticated`,
                        {}, (err) => {})
                })
            });
        }
    });

    fastify.route({
        method: "POST",
        url: "/add-course",
        schema: {
            body: {
                type: "object",
                required: ["userId", "courseId"],
                properties: {
                    userId: { type: "string" },
                    courseId: { type: "string" }
                }
            }
        },
        preValidation: [ fastify.authenticate ],
        handler: function(request, reply) {
            const um = userModule({ mongo: fastify.mongo });

            function getUserCallback(err, result) {
                if (err || !result) {
                    reply.status(500);
                    reply.send(err);
                    return;
                }
                
                const user = um.User.fromJson(result);
                user.courses.push(request.body.courseId);

                // update database
                user.update({$set: 
                    {
                        courses: user.courses
                    }
                }, err => {
                    if (err) {
                        reply.status(400);
                        reply.send(err);
                        return;
                    }

                    reply.status(200);
                    reply.send("course added");
                });
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
        url: "/:userId",
        preValidation: [ fastify.authenticate ],
        handler: function(request, reply) {
            const um = userModule({ mongo: fastify.mongo });

            um.User.sanitizedJson(request.params.userId, function(err, data) {
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
