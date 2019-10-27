const userModule = require("../../../user");
const ru = require("../../../utils/router");

function routes(fastify, opts, done) {
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
        handler: async (request, reply) => {
            const um = userModule({ mongo: fastify.mongo });

            try {
                await um.User.registerForNotifications(
                    request.body.userId, request.body.fcmToken
                );
            } catch (e) {
                if (ru.errCheck(reply, 400, e)) return;
            }

            reply.status(200);
            reply.send("New FCM token registered.");
        }
    });

    done();
}

module.exports = routes;
