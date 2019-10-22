const notificationsModule = require("../../../notifications");

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
        handler: function(request, reply) {
            const nm = notificationsModule({ mongo: fastify.mongo });
            nm.registerUserForNotifications(request.body.userId, request.body.fcmToken,
                function(err, data) {
                    if (err) {
                        reply.status(400);
                        reply.send(err);
                        return;
                    }

                    reply.status(200);
                    reply.send('New FCM token registered.');
            });
        }
    });

    done();
}

module.exports = routes;