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
                required: ["access_token"],
                properties: {
                    access_token: { type: "string" },
                    test_email:  { type: "string" },
                    longitude: { type: "number" },
                    latitude: { type: "number" },
                }
            }
        },
        preValidation: [ fastify.authenticate ],
        handler: async (request, reply) => {
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
                    if (ru.errCheck(reply, rc.INTERNAL_SERVER_ERROR, e)) return;
                }
            }

            if (!emailJson.email) {
                request.log.info(emailJson);
                ru.errCheck(reply, rc.INTERNAL_SERVER_ERROR, "No email found");
                return;
            }

            let userExists;
            try {
                userExists = await um.User.exists(emailJson.email);
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) return;
            }

            if (userExists) {
                ru.errCheck(reply, rc.INTERNAL_SERVER_ERROR, "User exists");
                return;
            }

            // store to database
            const newUser = um.User.newUser(emailJson.email);
            newUser.location = location;
            try {
                await newUser.create();
            } catch (e) {
                if (ru.errCheck(reply, rc.INTERNAL_SERVER_ERROR, e)) return;
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
        handler: async (request, reply) => {
            const um = userModule({ mongo: fastify.mongo });

            let userExists;
            try {
                userExists = await um.User.exists(request.body.userId);
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) return;
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
            user.courses.push(request.body.courseId);

            // update database
            try {
                await user.update({$set:
                        {
                            courses: user.courses
                        }
                });
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) return;
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
        handler: async (request, reply) => {
            const um = userModule({ mongo: fastify.mongo });

            const location = {
                longitude: request.body.longitude,
                latitude: request.body.latitude
            };

            let exists;
            try {
                exists = await um.User.exists(request.params.userId);
            } catch (e) {
                ru.errCheck(reply, rc.BAD_REQUEST, e);
                return;
            }

            if (!exists) {
                ru.errCheck(reply, rc.BAD_REQUEST, "No user found");
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

    /* GET Requests */

    /**
     * GET user data
     */
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
