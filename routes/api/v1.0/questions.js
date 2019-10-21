const questionsModule = require('../../../questions');
const userModule = require('../../../user');

function routes (fastify, opts, done) {
    fastify.route({
        method: 'POST',
        url: '/create',
        schema: {
            body: {
                type: 'object',
                required: ['userId', 'title', 'courseCode', 'questionText'],
                properties: {
                    userId: { type: 'string' },
                    title: { type: 'string' },
                    courseCode: { type: 'string' },
                    questionText:  { type: 'string' }
                }
            }
        },
        preValidation: [ fastify.authenticate ],
        handler: function(request, reply) {
            const qm = questionsModule({ mongo: fastify.mongo });
            const um = userModule({ mongo: fastify.mongo });

            um.User.exists(request.body.userId)
                .then(result => {
                    if (result) {
                        qm.createQuestion(request.body);
                    } else {
                        reply.status(400);
                        reply.send(err);
                    }
                })
                .catch(err => {
                    reply.status(400);
                    reply.send(err);
                });
        }
    });

    done();
}

module.exports = routes;
