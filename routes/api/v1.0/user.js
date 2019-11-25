const auth = require("../../../authentication");
const userModule = require("../../../user");

const ru = require("../../../utils/router");
const rc = ru.responseCodes;

function routes (fastify, opts, done) {
    /* POST Requests */

    /**
     * POST - Register a new user
     */
    fastify.route({
        method: "POST",
        url: "/register",
        schema: {
            body: {
                type: "object",
                required: ["accessToken"],
                properties: {
                    accessToken: { type: "string" },
                    testEmail:  { type: "string" },
                    longitude: { type: "number" },
                    latitude: { type: "number" },
                }
            }
        },
        preValidation: [ fastify.authenticate ],
        async handler(request, reply) {
            const um = userModule({ mongo: fastify.mongo });
            request.log.info(request.body);

            const location = {
                longitude: request.body.longitude,
                latitude: request.body.latitude
            };

            let emailJson;
            if (process.env.MODE === "test") {
                emailJson = { email: request.body.test_email };
            } else {
                try {
                    emailJson = await auth.requestEmail(
                        request.body.access_token
                    );
                } catch (e) {
                    if (ru.errCheck(reply, rc.INTERNAL_SERVER_ERROR, e)) {
                        return;
                    }
                }
            }

            if (!emailJson.email) {
                request.log.info(emailJson);
                ru.errCheck(reply, rc.INTERNAL_SERVER_ERROR, "No email found");
                return;
            }

            let userExists;
            try {
                /* eslint-disable-next-line */
                userExists = await um.User.exists(emailJson.email);
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) {return;}
            }

            if (userExists) {
                ru.errCheck(reply, rc.BAD_REQUEST, "User exists");
                return;
            }

            // store to database
            const newUser = um.User.newUser(emailJson.email);
            newUser.location = location;
            try {
                await newUser.create();
            } catch (e) {
                if (ru.errCheck(reply, rc.INTERNAL_SERVER_ERROR, e)) {return;}
            }

            // done
            reply.status(rc.OK);
            reply.send();

        }
    });

    /**
     * POST - Add a new course by ID
     */
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
        async handler(request, reply) {
            const um = userModule({ mongo: fastify.mongo });

            let userExists;
            try {
                /* eslint-disable-next-line */
                userExists = await um.User.exists(request.body.userId);
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) {return;}
            }

            if (!userExists) {
                ru.errCheck(reply, rc.BAD_REQUEST, "Provided user doesn't exist.");
                return;
            }

            let uJson;
            try {
                uJson = await um.User.retrieve(request.body.userId);
            } catch (e) {
                ru.errCheck(reply, rc.BAD_REQUEST, e);
            }

            if (!uJson) {
                ru.errCheck(reply, rc.BAD_REQUEST,
                    "Provided user json was empty.");
                return;
            }

            const user = um.User.fromJson(uJson);

            // check authentication token before modifying user data
            if (!auth.verifyUserToken(fastify, request, user.userId)) {
                ru.errCheck(reply, rc.UNAUTHORIZED, "Invalid credentials.");
                return;
            }

            user.courses.push(request.body.courseId);

            // update database
            try {
                await user.update({$set:
                        {
                            courses: user.courses
                        }
                });
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) {return;}
            }

            reply.status(rc.OK);
            reply.send("course added");

        }
    });

    /**
     * PUT user location data
     */
    fastify.route({
        method: "PUT",
        url: "/location/:userId",
        body: {
            type: "object",
            required: ["longitude", "latitude"],
            properties: {
                longitude: { type: "number" },
                latitude: { type: "number" }
            }
        },
        preValidation: [ fastify.authenticate ],
        async handler(request, reply) {
            const um = userModule({ mongo: fastify.mongo });

            const location = {
                longitude: request.body.longitude,
                latitude: request.body.latitude
            };

            let exists;
            try {
                /* eslint-disable-next-line */
                exists = await um.User.exists(request.params.userId);
            } catch (e) {
                ru.errCheck(reply, rc.BAD_REQUEST, e);
                return;
            }

            if (!exists) {
                ru.errCheck(reply, rc.BAD_REQUEST, "No user found");
                return;
            }

            if (!auth.verifyUserToken(fastify, request, request.params.userId)) {
                ru.errCheck(reply, rc.UNAUTHORIZED, "Invalid credentials.");
                return;
            }

            try {
                const userJson = await um.User.retrieve(request.params.userId);
                const user = await um.User.fromJson(userJson);
                await user.update({
                    $set: {
                        location: {
                            longitude: location.longitude,
                            latitude: location.latitude
                        }
                    }
                });
            } catch (e) {
                ru.errCheck(reply, rc.INTERNAL_SERVER_ERROR, e);
                return;
            }

            reply.status(rc.OK);
            reply.send({ msg: "Updated location successfully" });
        }
    });

    /**
     * Send a message to a user
     */
    fastify.route({
        method: "POST",
        url: "/sendMessage",
        preValidation: [ fastify.authenticate ],
        body: {
            type: "object",
            required: ["userId", "receiverId", "message"],
            properties: {
                userId: { type: "string" },
                receiverId: { type: "string" },
                message: { type: "string" }
            }
        },
        async handler (request, reply) {
            const um = userModule({ mongo: fastify.mongo });

            const body = request.body;

            let usersExist;
            try {
                /* eslint-disable */
                const userExists = await um.User.exists(body.userId);
                const receiverExists = await um.User.exists(body.receiverId);
                /* eslint-enable */
                usersExist = userExists && receiverExists;
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) {return;}
            }

            if (!usersExist) {
                reply.status(rc.BAD_REQUEST);
                reply.send("Provided user(s) doesn't exist.");
                return;
            }

            if (!auth.verifyUserToken(fastify, request, body.userId)) {
                ru.errCheck(reply, rc.UNAUTHORIZED, "Invalid credentials.");
                return;
            }

            /* Send the message through a notification */
            try {
                await um.User.sendNotification(
                    body.receiverId,
                    body.message,
                    "message",
                    {
                        notificationType: "message"
                    });

            } catch (e) {
                request.log.info(e);
                if (ru.errCheck(reply, rc.INTERNAL_SERVER_ERROR, e)) {return;}
            }

            reply.status(rc.OK);
            reply.send({msg: "Sent message."});
        }
    });

    /* GET Requests */

    /**
     * GET user data
     */
    fastify.route({
        method: "GET",
        url: "/:userId",
        preValidation: [ fastify.authenticate ],
        async handler(request, reply) {
            const um = userModule({ mongo: fastify.mongo });

            let user;
            try {
                user = await um.User.sanitizedJson(request.params.userId);
            } catch (e) {
                ru.errCheck(reply, rc.BAD_REQUEST, e);
                return;
            }
            if (!user) {
                ru.errCheck(reply, rc.BAD_REQUEST, "No user found");
                return;
            }

            reply.status(rc.OK);
            reply.send(user);
        }
    });

    done();
}

module.exports = routes;
