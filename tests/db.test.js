const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = require('assert');
const app = require('../app.js');
const config = require('../config.js');
const database = require('../database');

chai.use(chaiHttp);
chai.should();

// 'mongodb://user:password@host:port'
const connectionHost = config.mongoDBConnection.host || "localhost";
const connectionPort = config.mongoDBConnection.port || 27017;
const connectionURI = 'mongodb://' +
    config.mongoDBConnection.user + ":" + config.mongoDBConnection.password + "@" +
    connectionHost + ":" + connectionPort + "/" + config.mongoDBConnection.database;

const dbtests = function () {
    describe("DB API Tests", () => {
        describe("POST /api/v1.0/testdb", () => {
            // Test db entry
            const db_entry = {test0: "JSON Data"};
            it("should return 200", (done) => {
                chai.request(app)
                    .post('/api/v1.0/testdb')
                    .set('content-type', 'application/json')
                    .send(db_entry)
                    .end((err, res) => {
                        res.should.have.status(200);
                        done();
                    });
            });
            afterEach(function (done) {
                // Get the documents collection
                const db = database.getDatabase();
                const collection = db.collection('documents');
                // Find document
                collection.find({}, {projection: {_id: 0, test0: 1}})
                    .toArray(function (err, result) {
                        assert.ok(err === null);
                        assert.ok(result.filter(e => (e.test0 === "JSON Data")));
                        console.log('Found JSON Data');
                        done();
                    });
            })
        });
    });
};

database.initDatabase(config.mongoDBConnection.database, connectionURI, dbtests);
