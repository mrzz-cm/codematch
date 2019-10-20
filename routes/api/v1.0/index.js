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

    // /* POST MongoDB. */
    // fastify.route({
    //     method: 'POST',
    //     url: '/testdb',
    //     // schema: {},
    //     handler: (request, reply) => {
    //         console.log(request.body);
    //
    //         const db = fastify.mongo.db;
    //
    //         const insertDocuments = function (db, data, callback) {
    //             // Get the documents collection
    //             const collection = fastify.mongo.db.collection('documents');
    //             // Insert document
    //             collection.insertOne(data, function (err, result) {
    //                 assert.ok(err === null);
    //                 console.log("Inserted document into the collection");
    //                 callback();
    //             });
    //         };
    //
    //         insertDocuments(db, request.body, () => { reply.send(); });
    //     }
    // });

    done();
}

module.exports = routes;
