const authentication = require("../../../authentication");
const ru = require("../../../utils/router");

function routes (fastify, opts, done) {
    /* GET testing token. */
    fastify.route({
        method: "GET",
        url: "/google/callback",
        handler: function(request, reply) {
            this.getAccessTokenFromAuthorizationCodeFlow(request, (err, result) => {
                if (ru.errCheck(reply, 400, err)) return;
                authentication.requestEmail(result.access_token, function (err, res, data) {
                    if (ru.errCheck(reply, 400, err)) return;
                    reply.send(result);
                });
            });
        }});

    /* GET AUTH token. */
    fastify.route({
        method: "GET",
        url: "/token",
        schema: {
            querystring: {
                properties: {
                    access_token: {type: "string"}
                }
            },
            response: {
                200: {
                    type: "object",
                    properties: {
                        jwt: {type: "string"}
                    }
                }
            }
        },
        handler: (request, reply) => {
            console.log(request.query.access_token);
            authentication.requestEmail(request.query.access_token, function (err, res, data) {
                if (err || res.statusCode !== 200) {
                    reply.status(res.statusCode);
                    reply.send(err);
                    return;
                }

                const token = fastify.jwt.sign(data.email);
                reply.send(token);
                console.log(token);
            });
        }
    });

    done();
}

module.exports = routes;
