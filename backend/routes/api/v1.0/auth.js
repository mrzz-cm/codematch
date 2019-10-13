var req = require('request');

function routes (fastify, opts, done) {
    /* GET AUTH token. */
    fastify.route({
        method: 'GET',
        url: '/google/callback',
        handler: function(request, reply) {
            this.getAccessTokenFromAuthorizationCodeFlow(request, (err, result) => {
                if (err) {
                    reply.send(err);
                    return
                }

                req({
                    url: 'https://openidconnect.googleapis.com/v1/userinfo',
                    method: 'GET',
                    qs: { scope: "openid email"},
                    headers: {
                        Authorization: 'Bearer ' + result.access_token
                    },
                    json: true
                }, function (err, res, data) {
                    if (err) {
                        reply.send(err);
                        return
                    }
                    reply.send(data)
                })
            })
        }});

    done();
}

module.exports = routes;
