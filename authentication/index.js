const fastifyPlugin = require("fastify-plugin");
const jwtPlugin = require("fastify-jwt");
const oauthPlugin = require("fastify-oauth2");

const req = require("request");

const config = require("../config");

// https://github.com/fastify/fastify-jwt

// Authentication preValidation plugin
const jwtValdatorPlugin = fastifyPlugin(async function(fastify) {
    fastify.register(jwtPlugin, {
        secret: config.jwtSecret
    });

    fastify.decorate("authenticate", async function(request, reply) {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.send(err);
        }
    });
});

const requestEmail = function(token, callback) {
    console.log("request token: " + token);
    req({
        url: "https://openidconnect.googleapis.com/v1/userinfo",
        method: "GET",
        qs: { scope: "openid email"},
        headers: {
            Authorization: "Bearer " + token
        },
        json: true
    }, callback);
};

// https://github.com/fastify/fastify-oauth2
module.exports = {
    plugin: jwtValdatorPlugin,
    options: {},
    requestEmail: requestEmail,
    oauthPlugin: oauthPlugin,
    oauthOptions: {
        name: "googleOAuth2",
        scope: ["email"],
        credentials: {
            client: {
                id: config.googleAuth.web.client_id,
                secret: config.googleAuth.web.client_secret
            },
            auth: oauthPlugin.GOOGLE_CONFIGURATION
        },
        // register a fastify url to start the redirect flow
        startRedirectPath: "/auth/google",
        // Google redirect here after the user login
        callbackUri: `https://${config.domain}/auth/google/callback`
    }
};
