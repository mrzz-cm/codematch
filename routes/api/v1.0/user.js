const authentication = require("../../../authentication");
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
                });
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
