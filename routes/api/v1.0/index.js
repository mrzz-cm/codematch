const express = require('express');
const router = express.Router();

const assert = require('assert');
const database = require('../../../database');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.json({"title": 'API'});
});

/* PUT MongoDB. */
router.post('/testdb', function (req, res, next) {
    console.log(req.body);

    const db = database.getDatabase();

    const insertDocuments = function (db, data, callback) {
        // Get the documents collection
        const collection = db.collection('documents');
        // Insert document
        collection.insertOne(data, function (err, result) {
            assert.ok(err === null);
            console.log("Inserted document into the collection");
            callback();
        });
    };

    insertDocuments(db, req.body, function () {
        res.end()
    });

});

module.exports = router;
