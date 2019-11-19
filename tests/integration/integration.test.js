"use strict";

/* eslint no-undef: "off" */

const app = require("../../app.js");
const userModule = require("../../user");
const questionsModule = require("../../questions");
const fastify = app.fastify;

let um;
let qm;

beforeAll(async () => {
    await fastify.ready();
    um = userModule({ mongo: fastify.mongo });
    qm = questionsModule({ mongo: fastify.mongo });
});

afterAll(() => {
    fastify.close();
});

describe("Account creation test", () => {
    const testUser = "testuser0@example.com";

    afterAll(async () => {
        const collection = await fastify.mongo.db.collection("users");
        await collection.deleteOne({ userId: testUser });
    });

    test("Account creation success", async (done) => {
        const response = await fastify.inject({
            method: "POST",
            url: "/user/register",
            body: {
                test_email: testUser,
                longitude: 100,
                latitude: -100,
                access_token: "NOT_A_TOKEN"
            }
        });

        expect(response.statusCode).toBe(200);

        // check the user is in database
        um.User.retrieve(testUser)
            .then(() => expect(um.User.exists(testUser)).toBeTruthy())
            .then(() => done());
    });
});


describe("Posting new question test", () => {

    let question;
    const testUser = "testuser1@example.com";

    afterAll(async () => {
        const collection = await fastify.mongo.db.collection("questions");
        const userCollection = await fastify.mongo.db.collection("users");
        await collection.deleteOne({uuid: question.uuid});
        await userCollection.deleteOne({ userId: testUser });
    });

    beforeAll(async () => {
        const user = um.User.newUser(testUser);
        await user.create();
    });

    test("Post new question success", async (done) => {
        const response = await fastify.inject({
            method: "POST",
            url: "/questions/create",
            body: {
                userId: testUser,
                title: "Test Question",
                courseCode: "CPEN 321",
                questionText: "A test question."
            }
        });

        expect(response.statusCode).toBe(200);

        // check existence of question in user and question database
        um.User.retrieve(testUser)
            .then((user) => qm.Question.retrieve(user.currentQuestion))
            .then((q) => {
                question = q;
                expect(q).toBeTruthy();
                expect(q.uuid).toBeTruthy();
                expect(q.seeker).toBe(testUser);
                expect(q.questionState).toBe("Waiting");
                return done();
            })
    });
});


describe("Helping a question test", () => {

    let question;
    const testSeeker = "testSeeker@example.com";
    const testHelper = "testHelper@example.com";

    afterAll(async () => {
        const collection = await fastify.mongo.db.collection("questions");
        const userCollection = await fastify.mongo.db.collection("users");
        await collection.deleteOne({uuid: question.uuid});
        await userCollection.deleteOne({ userId: testSeeker });
        await userCollection.deleteOne({ userId: testHelper });
    });

    beforeAll(async () => {
        const seekerUser = um.User.newUser(testSeeker);
        await seekerUser.create();

        const helperUser = um.User.newUser(testHelper);
        await helperUser.create();
    });

    test("Offering help to a question test", async (done) => {
        // step one: seeker posts the question
        await fastify.inject({
            method: "POST",
            url: "/questions/create",
            body: {
                userId: testSeeker,
                title: "Test Question",
                courseCode: "CPEN 321",
                questionText: "A test question."
            }
        });

        // get the question ID
        var seekerUser = await um.User.retrieve(testSeeker);
        question = await qm.Question.retrieve(seekerUser.currentQuestion);

        // step two: helper accepts to give help
        const helpResponse = await fastify.inject({
            method: "POST",
            url: "/questions/accept",
            body: {
                userId: testHelper,
                questionId: question.uuid,
            }
        });

        expect(helpResponse.statusCode).toBe(200);

        // check the seeker and helper status
        seekerUser = await um.User.retrieve(testSeeker);
        const helperUser = await um.User.retrieve(testHelper);

        expect(seekerUser.currentQuestion).toBe(question.uuid);
        expect(helperUser.currentQuestion).toBe(question.uuid);
        
        // check the question data
        question = await qm.Question.retrieve(question.uuid);

        expect(question.seeker).toBe(testSeeker);
        expect(question.helperAccepted).toBe(true);
        expect(question.finalHelper).toBe(testHelper);
        expect(question.questionState).toBe("Matched");

        done();
    });
});
