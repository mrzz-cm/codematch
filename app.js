const fastify = require('fastify')({logger: true});

const routes = [
    {
        plugin: require('./routes/api/v1.0'),
        options: {}
    }
];

routes.forEach((p) => fastify.register(p.plugin, p.options));

// https://lmammino.github.io/fastify/docs/testing/
function startServer(fastify, port, callback) {
    fastify.listen(port, (err, address) => {
        if (err) {
            fastify.log.error(err);
            process.exit(1);
        }
        fastify.log.info(`server listening on ${address}`);
        callback(err, fastify);
    })
}

// Options currently unused
module.exports = {
    fastify: fastify,
    start: startServer,

};
