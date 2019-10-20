const fastifyPlugin = require("fastify-plugin");
const jwtPlugin = require("fastify-jwt");

const config = require('../config');

// https://github.com/fastify/fastify-jwt

// Authentication preValidation plugin
const jwtValdatorPlugin = fastifyPlugin(async function(fastify, opts) {
    fastify.register(jwtPlugin, {
        secret: config.jwtSecret
    });

    fastify.decorate("authenticate", async function(request, reply) {
        try {
            await request.jwtVerify()
        } catch (err) {
            reply.send(err)
        }
    })
});

// https://github.com/fastify/fastify-oauth2
module.exports = {
    plugin: jwtValdatorPlugin,
    options: {}
};
