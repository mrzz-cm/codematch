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
            const um = userModule({ mongo: fastify.mongo });
            console.log(request.body);



            um.createUser(request.body.google_token, async function (err, res, data) {
                if (err || (res.statusCode !== 200) || !data.email) {
                    console.log(data);
                    reply.status(res.statusCode);
                    reply.send(err);
                    return
                }

                const userExists = await um.User.exists(data.email);

                if (userExists) {
                    reply.status(500);
                    reply.send("User exists");
                    return
                }

                // store to database
                um.User.newUser(data.email).create((err) => {
                    if (err) {
                        reply.status(500);
                        reply.send(err);
                        return
                    }
                    // done
                    reply.status(200);
                    reply.send();
                });
            });
        }
    });

    done();
}

module.exports = routes;
