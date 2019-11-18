"use strict";

/* eslint no-undef: "off" */

const app = require("../../app.js");
const userModule = require("../../user");
const questionsModule = require("../../questions");
const fastify = app.fastify;

describe("Account creation test", () => {
    let um;

    beforeEach(async () => {
        await fastify.ready();
        um = userModule({ mongo: fastify.mongo })
    });

    afterAll(() => {
        fastify.close();
    });

    test("Account creation success", async (done) => {
        const response = await fastify.inject({
            method: "POST",
            url: "/user/register",
            body: {
                "test_email": "abcd",
                "longitude": 100,
                "latitude": -100
            }
        });

        expect(response.statusCode).toBe(200);

        // check the user is in database
        um = userModule({ mongo: fastify.mongo });
        const userExists = await um.User.retrieve('abcd');

        expect(userExists).toBe(true);

        done();
    });
});


describe("Posting new question test", () => {
    let um;
    let qm;

    beforeEach(async () => {
        await fastify.ready();
        um = userModule({ mongo: fastify.mongo });
        qm = questionsModule({ mongo: fastify.mongo });
    });

    afterAll(() => {
        fastify.close();
    });

    test("Post new question success", async (done) => {
        const response = await fastify.inject({
            method: "POST",
            url: "/questions/create",
            body: {
                "userId": "user0",
                "title": "Test Question",
                "courseCode": "CPEN 321",
                "questionText": "A test question."
            }
        });

        expect(response.statusCode).toBe(200);

        // check existence of question in user and question database
        const user = um.User.retrieve("user0");
        const questionId = user.currentQuestion;

        expect(questionId).toBeTruthy();

        // check the question in the database
        const question = qm.Question.retrieve(questionId);
        expect(question).toBeTruthy();
        expect(question.seeker).toBe("user0");

        done();
    });
});
