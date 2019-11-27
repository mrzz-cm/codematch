"use strict";

/* eslint no-undef: "off" */

const app = require("../../app");
const questionsModule = require("../../questions");
const fastify = app.fastify;

let qm;

beforeAll(async () => {
    await fastify.ready();
    qm = questionsModule({ mongo: fastify.mongo });
});

afterAll(() => {
    fastify.close();
});

describe("Question creation test", () => {
    let question;

    afterAll(async () => {
        const collection = await fastify.mongo.db.collection("questions");
        await collection.deleteMany({});
    });

    test("Checks question is created", async (done) => {
        question = qm.Question.newQuestion(
            "testuser@example.com",
            "Test question",
            "CPEN321",
            "..."
        );

        question.create()
            .then(() => qm.Question.exists(question.uuid))
            .then((result) => expect(result).toBeTruthy())
            .then(() => done());
    });
});

describe("Question constructor test", () => {

    test("New question constructor test", async (done) => {
        const newQuestion = qm.Question.newQuestion(
            "test@example.com", "Question Title",
            "CPEN 321", "A sample question."
        );

        expect(newQuestion.seeker).toBe("test@example.com");
        expect(newQuestion.title).toBe("Question Title");
        expect(newQuestion.courseCode).toBe("CPEN 321");
        expect(newQuestion.questionText).toBe("A sample question.");

        done();
    });
});

describe("Question JSON test", () => {

    test("Question fromJson constructor and toJson method working", async (done) => {
        const questionJSON = {
            "uuid": "abcd",
            "title": "Question Title",
            "courseCode": "CPEN 321",
            "questionText": "A sample question",
            "seeker": "seeker@example.com",
            "creationTimestamp": 123,
            "optimalHelper": "optimal@example.com",
            "helperNotifiedTimestamp": 1234,
            "helperAccepted": false,
            "prevCheckedHelpers": ["skipped@example.com"],
            "finalHelper": null,
            "questionState": "Waiting",
            "finalScore": null
        };

        const newQuestion = qm.Question.fromJson(questionJSON);

        expect(newQuestion.toJson()).toEqual(questionJSON);

        // modify the question, try again
        newQuestion.helperAccepted = true;

        expect(newQuestion.toJson().helperAccepted).toBeTruthy();

        done();
    });
});


