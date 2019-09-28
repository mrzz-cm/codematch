const MongoClient = require('mongodb').MongoClient;

// Secrets and connection details
const config = require('../config.js');

// 'mongodb://user:password@host:port'
const connectionHost = config.mongoDBConnection.host || "localhost";
const connectionPort = config.mongoDBConnection.port || 27017;
const connectionURI = 'mongodb://' +
    config.mongoDBConnection.user + ":" + config.mongoDBConnection.password + "@" +
    connectionHost + ":" + connectionPort + "/" + config.mongoDBConnection.database;

const client = new MongoClient(connectionURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

module.exports = {
    client: client
};


