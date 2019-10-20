const questionsModule = require('../../../questions');

function routes (fastify, opts, done) {
    fastify.route({
        method: 'POST',
        url: '/create',
        schema: {
            body: {
                type: 'object',
                required: ['user'],
                properties: {
                    user: { type: 'string' }
                }
            }
        },
        handler: function(request, reply) {
            questionsModule.createQuestion(request, reply);
        }
    });

    done();
}

module.exports = routes;
