const fastifyPlugin = require("fastify-plugin");
const jwtPlugin = require("fastify-jwt");
const req = require('request');

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

const requestEmail = function(token, callback) {
    console.log("request token: " + token);
    req({
        url: 'https://openidconnect.googleapis.com/v1/userinfo',
        method: 'GET',
        qs: { scope: "openid email"},
        headers: {
            Authorization: 'Bearer ' + token
        },
        json: true
    }, callback);
};

// https://github.com/fastify/fastify-oauth2
module.exports = {
    plugin: jwtValdatorPlugin,
    options: {},
    requestEmail: requestEmail
};
