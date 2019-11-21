const userModule = require("../../../user");
const ru = require("../../../utils/router");
const rc = ru.responseCodes;

function routes(fastify, opts, done) {

    /* POST Requests */

    /**
     * POST - Register a new user for push notifications
     */
    fastify.route({
        method: "POST",
        url: "/register",
        schema: {
            body: {
                type: "object",
                required: ["userId", "fcmToken"],
                properties: {
                    userId: { type: "string" },
                    fcmToken: { type: "string" }
                }
            }
        },
        preValidation: [ fastify.authenticate ],
        async handler(request, reply) {
            const um = userModule({ mongo: fastify.mongo });

            try {
                await um.User.registerForNotifications(
                    request.body.userId, request.body.fcmToken
                );
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) return;
            }

            reply.status(rc.OK);
            reply.send("New FCM token registered.");
        }
    });

    done();
}

module.exports = routes;
