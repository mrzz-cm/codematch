const auth = require("../../../authentication");
const userModule = require("../../../user");

const ru = require("../../../utils/router");

function routes (fastify, opts, done) {
    fastify.route({
        method: "POST",
        url: "/register",
        schema: {
            body: {
                type: "object",
                required: ["access_token"],
                properties: {
                    access_token: { type: "string" },
                    test_email:  { type: "string" }
                }
            }
        },
        preValidation: [ fastify.authenticate ],
        handler: async (request, reply) => {
            const um = userModule({ mongo: fastify.mongo });
            request.log.info(request.body);

            let emailJson;
            if (process.env.MODE === "test") {
                emailJson = { email: request.body.test_email };
            } else {
                try {
                    emailJson = await auth.requestEmail(
                        request.body.access_token
                    );
                } catch (e) {
                    if (ru.errCheck(reply, 500, e)) return;
                }
            }

            if (!emailJson.email) {
                request.log.info(emailJson);
                ru.errCheck(reply, 500, "No email found");
                return;
            }

            let userExists;
            try {
                userExists = await um.User.exists(emailJson.email);
            } catch (e) {
                if (ru.errCheck(reply, 400, e)) return;
            }

            if (userExists) {
                ru.errCheck(reply, 500, "User exists");
                return;
            }

            // store to database
            try {
                await um.User.newUser(emailJson.email).create();
            } catch (e) {
                if (ru.errCheck(reply, 500, e)) return;
            }

            // done
            reply.status(200);
            reply.send();

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
        handler: async (request, reply) => {
            const um = userModule({ mongo: fastify.mongo });

            let userExists;
            try {
                userExists = await um.User.exists(request.body.userId);
            } catch (e) {
                if (ru.errCheck(reply, 400, e)) return;
            }

            if (!userExists) {
                ru.errCheck(reply, 400, "Provided user doesn't exist.");
                return;
            }

            let uJson;
            try {
                uJson = await um.User.retrieve(request.body.userId);
            } catch (e) {
                ru.errCheck(reply, 400, e);
            }

            if (!uJson) {
                ru.errCheck(reply, 400,
                    "Provided user json was empty.");
                return;
            }

            const user = um.User.fromJson(uJson);
            user.courses.push(request.body.courseId);

            // update database
            try {
                await user.update({$set:
                        {
                            courses: user.courses
                        }
                });
            } catch (e) {
                if (ru.errCheck(reply, 400, e)) return;
            }

            reply.status(200);
            reply.send("course added");

        }
    });

    fastify.route({
        method: "GET",
        url: "/:userId",
        preValidation: [ fastify.authenticate ],
        handler: async (request, reply) => {
            const um = userModule({ mongo: fastify.mongo });

            let user;
            try {
                user = await um.User.sanitizedJson(request.params.userId);
            } catch (e) {
                ru.errCheck(reply, 400, e);
                return;
            }
            if (!user) {
                ru.errCheck(reply, 400, "No user found");
                return;
            }

            reply.status(200);
            reply.send(user);
        }
    });

    done();
}

module.exports = routes;
