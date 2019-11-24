"use strict";

/* eslint no-undef: "off" */
const app = require("../../app");
const matchingModule = require("../../matching");
const userModule = require("../../user");
const fastify = app.fastify;

let mm;
let um;

beforeAll(async () => {
    await fastify.ready();
    mm = matchingModule({ mongo: fastify.mongo });
    um = userModule({ mongo: fastify.mongo });
});

afterAll(() => {
    fastify.close();
});


describe("Optimal match test", () => {

    const testSeeker = "testSeeker@example.com";
    const testSeekerJson = {
        "_id": "5dd0c159655e815a5740e06b",
        "courses": [],
        "currentQuestion": null,
        "fcmToken": null,
        "lastOnline": 1573962073665,
        "location": {
            "latitude": -123.24,
            "longitude": 49.26
        },
        "points": 1,
        "questionsHelped": [],
        "questionsPosted": [],
        "token": null,
        "userId": testSeeker
    };

    const testBadHelper = "badHelper@example.com";
    const testBadHelperJson = {
        "_id": "5dd0c159655e815a5740106b",
        "courses": [],
        "currentQuestion": null,
        "fcmToken": null,
        "lastOnline": 1,
        "location": {
            "latitude": -100.24,
            "longitude": 50.26
        },
        "points": 1,
        "questionsHelped": [],
        "questionsPosted": [],
        "token": null,
        "userId": testBadHelper
    };

    const testGoodHelper = "goodHelper@example.com";
    const testGoodHelperJson = {
        "_id": "5dd0c159655e815a5a40106b",
        "courses": [],
        "currentQuestion": null,
        "fcmToken": null,
        "lastOnline": 1573962073665,
        "location": {
            "latitude": -123.24,
            "longitude": 49.26
        },
        "points": 100,
        "questionsHelped": [],
        "questionsPosted": [],
        "token": null,
        "userId": testGoodHelper
    };


    afterAll(async () => {
        const userCollection = await fastify.mongo.db.collection("users");
        await userCollection.deleteOne({ userId: testSeeker });
        await userCollection.deleteOne({ userId: testBadHelper });
        await userCollection.deleteOne({ userId: testGoodHelper });
    });

    beforeAll(async () => {
        const seekerUser = um.User.fromJson(testSeekerJson);
        await seekerUser.create();
        const badHelperUser = um.User.fromJson(testBadHelperJson);
        await badHelperUser.create();
        const goodHelperUser = um.User.fromJson(testGoodHelperJson);
        await goodHelperUser.create();
    });

    test("Optimal match test", async (done) => {
        // create a new match
        const match = new mm.Match({
            seeker: testSeeker,
            prevCheckedHelpers: []
        });

        const optimalHelper = await match.optimalHelper();

        expect(optimalHelper.userId).toEqual(testGoodHelper);

        done();
    });
});
