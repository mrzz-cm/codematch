const oauthPlugin = require('fastify-oauth2');

const config = require('../config');

// https://github.com/fastify/fastify-oauth2

module.exports = {
    plugin: oauthPlugin,
    options: {
        name: 'googleOAuth2',
        scope: ['email'],
        credentials: {
            client: {
                id: config.googleAuth.web.client_id,
                secret: config.googleAuth.web.client_secret
            },
            auth: oauthPlugin.GOOGLE_CONFIGURATION
        },
        // register a fastify url to start the redirect flow
        startRedirectPath: '/auth/google',
        // Google redirect here after the user login
        callbackUri: `https://${config.domain}/auth/google/callback`
    }
};
