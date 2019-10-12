const t = require('tap');
const app = require('../app');
const test = t.test;
const request = require('request');

app.start(app.fastify, 0, (err, fastify) => {
    t.error(err);

    test('POST /testdb', t => {
        t.plan(4);
        const db_entry = {test0: "JSON Data"};
        // Perform the request
        request({
            method: 'POST',
            json: db_entry,
            uri: `http://localhost:${fastify.server.address().port}/testdb`
        }, (err, response, body) => {
            // Unit test
            t.error(err);
            t.strictEqual(response.statusCode, 200);

            const collection = fastify.mongo.db.collection('documents');

            // Find document
            collection.find({}, {projection: {_id: 0, test0: 1}})
                .toArray(function (err, result) {
                    t.error(err);
                    t.assert(result.filter(e => (e.test0 === "JSON Data")));
                    console.log('Found JSON Data');
                    fastify.close();
                });
        })
    });
});
//
// describe("POST /api/v1.0/testdb", () => {
//     // Test db entry
//     const db_entry = {test0: "JSON Data"};
//     it("should return 200", (done) => {
//         chai.request(app)
//             .post('/api/v1.0/testdb')
//             .set('content-type', 'application/json')
//             .send(db_entry)
//             .end((err, res) => {
//                 res.should.have.status(200);
//                 done();
//             });
//     });
//     afterEach(function (done) {
//         // Get the documents collection
//         const db = database.getDatabase();
//         const collection = db.collection('documents');
//         // Find document
//         collection.find({}, {projection: {_id: 0, test0: 1}})
//             .toArray(function (err, result) {
//                 assert.ok(err === null);
//                 assert.ok(result.filter(e => (e.test0 === "JSON Data")));
//                 console.log('Found JSON Data');
//                 done();
//             });
//     })
// });
