const assert = require('assert');

function routes (fastify, opts, done) {
    /* GET home page. */
    fastify.route({
        method: 'GET',
        url: '/',
        schema: {
            querystring: {},
            response: {
                200: {
                    type: 'object',
                    properties: {
                        title: {type: 'string'}
                    }
                }
            }
        },
        preValidation: [ fastify.authenticate ],
        handler: (request, reply) => {
            reply.send({"title": 'API'});
        }});

    done();
}

module.exports = routes;
