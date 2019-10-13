const t = require('tap');
const app = require('../app.js');
const test = t.test;
const request = require('request');

app.start(app.fastify, 0, (err, fastify) => {
    t.error(err);

    test('The server should start', t => {
        t.plan(3);
        // Perform the request
        request({
            method: 'GET',
            uri: `http://localhost:${fastify.server.address().port}`
        }, (err, response, body) => {
            // Unit test
            t.error(err);
            t.strictEqual(response.statusCode, 200);
            t.deepEqual(JSON.parse(body), {title: 'API'});
            fastify.close()
        })
    });
});