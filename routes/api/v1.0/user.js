const userModule = require('../../../user');

function routes (fastify, opts, done) {
    fastify.route({
        method: 'POST',
        url: '/register',
        schema: {
            body: {
                type: 'object',
                required: ['google_token'],
                properties: {
                    google_token: { type: 'string' }
                }
            }
        },
        handler: function(request, reply) {
            userModule.createUser(request, reply);
        }
    });

    done();
}

module.exports = routes;
