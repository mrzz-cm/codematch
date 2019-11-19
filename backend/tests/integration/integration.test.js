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
                return done();
            })
    });
});
