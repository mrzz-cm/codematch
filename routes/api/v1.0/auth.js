var req = require('request');

function routes (fastify, opts, done) {
    /* GET AUTH token. */
    fastify.route({
        method: 'POST',
        url: '/token',
        schema: {
            querystring: {
                properties: {
                    access_token: {type: 'string'}
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        jwt: {type: 'string'}
                    }
                }
            }
        },
        handler: (request, reply) => {
            req({
                url: 'https://openidconnect.googleapis.com/v1/userinfo',
                method: 'GET',
                qs: { scope: "openid email"},
                headers: {
                    Authorization: 'Bearer ' + request.body.access_token
                },
                json: true
            }, function (err, res, data) {
                if (err || res.statusCode !== 200) {
                    // reply.send(err);
                    console.log(res);
                    reply.send();
                    return
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
