const auth = require("../../../authentication");
const ru = require("../../../utils/router");

const rc = ru.responseCodes;

function routes (fastify, opts, done) {

    /* GET Requests */

    /**
     * GET a google access token for testing.
     */
    fastify.route({
        method: "GET",
        url: "/google/callback",
        handler: async function(request, reply) {
            this.getAccessTokenFromAuthorizationCodeFlow(
                request, async (err, result) => {

                    if (ru.errCheck(reply, rc.BAD_REQUEST, err)) return;

                    let authData;
                    try {
                        authData = await auth.requestEmail(result.access_token);
                    } catch (e) {
                        if (ru.errCheck(reply, rc.BAD_REQUEST, e)) return;
                    }
                    reply.send(authData);
                });
        }});

    /**
     * GET a JSON Web token.
     */
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
        handler: async (request, reply) => {
            // Dont require real email during testing
            if (process.env.MODE === "test") {
                reply.send(fastify.jwt.sign(process.env.MODE));
                return;
            }

            let authData;
            try {
                authData = await auth.requestEmail(request.query.access_token);
            } catch (e) {
                if (ru.errCheck(reply, rc.BAD_REQUEST, e)) return;
            }

            reply.send(fastify.jwt.sign(authData.email));


        }
    });

    done();
}

module.exports = routes;
