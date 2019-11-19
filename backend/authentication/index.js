const fastifyPlugin = require("fastify-plugin");
const jwtPlugin = require("fastify-jwt");
const oauthPlugin = require("fastify-oauth2");

const req = require("request-promise-native");

const config = require("../config");

// https://github.com/fastify/fastify-jwt

// Authentication preValidation plugin
const jwtValdatorPlugin = fastifyPlugin(async function(fastify) {
    fastify.register(jwtPlugin, {
        secret: config.jwtSecret
    });

    fastify.decorate("authenticate", async (request, reply) => {
        // Dont require auth during testing
        if (process.env.MODE === "test") return;

        try {
            await request.jwtVerify();
        } catch (err) {
            reply.send(err);
        }
    });
});

async function requestEmail(token) {
    try {
        return await req({
            url: "https://openidconnect.googleapis.com/v1/userinfo",
            method: "GET",
            qs: {scope: "openid email"},
            headers: {
                Authorization: "Bearer " + token
            },
            json: true
        });
    } catch (e) {
        return new Error(`Failed to get email from google ${e}`);
    }
}

// https://github.com/fastify/fastify-oauth2
module.exports = {
    plugin: jwtValdatorPlugin,
    options: {},
    requestEmail,
    oauthPlugin,
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
