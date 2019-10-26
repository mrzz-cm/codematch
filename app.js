const fastify = require("fastify")({logger: true});
const config = require("./config");
const authentication = require("./authentication");

const mCfg = config.mongoDBConnection;
const mHost = config.mongoDBConnection.host || "localhost";
const mPort = config.mongoDBConnection.port || 27017;

fastify.register(
    require("fastify-mongodb"),
    {
        // force to close the mongodb connection when app stopped
        // the default value is false
        forceClose: true,
        url: `mongodb://${mCfg.user}:${mCfg.password}@${mHost}:${mPort}/${mCfg.database}`
    }
);

const routes = [
    {
        // Must be first
        plugin: authentication.plugin,
        options: authentication.options
    },
    {
        plugin: authentication.oauthPlugin,
        options: authentication.oauthOptions
    },
    {
        plugin: require("./routes/api/v1.0/auth"),
        options: { prefix: "/auth" }
    },
    {
        plugin: require("./routes/api/v1.0/questions"),
        options: { prefix: "/questions" }
    }
    ,
    {
        plugin: require("./routes/api/v1.0/user"),
        options: { prefix: "/user" }
    },
    {
        plugin: require("./routes/api/v1.0/notifications"),
        options: { prefix: "/notifications" }
    }
];
routes.forEach((p) => fastify.register(p.plugin, p.options));

function startServer(fastify, port, callback) {
    fastify.listen(port, (err) => {
        if (err) {
            fastify.log.error(err);
            process.exit(1);
        }
        callback(err, fastify);
    });
}

// Options currently unused
module.exports = {
    fastify: fastify,
    start: startServer,
};
