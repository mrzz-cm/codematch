const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

let _database;
let _client;

const initDatabase = function (database, uri, callback) {
    assert.ok(database);

    if (_database) {
        throw new Error("Database has already been initialized.");
    }
    _client = new MongoClient.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }, function (err, client) {
        _database = client.db(database);
        callback();
    });
};

const getDatabase = function () {
    assert.ok(_database, "Database " + _database + "hasn't been initialized");
    return _database;
};

module.exports = {
    getDatabase: getDatabase,
    initDatabase: initDatabase
};


