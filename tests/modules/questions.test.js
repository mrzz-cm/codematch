"use strict";

/* eslint no-undef: "off" */

<<<<<<< HEAD
const app = require("../../app.js");
const questionsModule = require("../../questions");
const fastify = app.fastify;


describe("Question creation test", () => {
    afterAll(() => {
        fastify.close();
    });

    test("New question constructor working", async (done) => {
        const qm = questionsModule({ mongo: fastify.mongo });

        const newQuestion = qm.Question.newQuestion(
            "test@example.com", "Question Title", "CPEN 321", "A sample question."
        );

        expect(newQuestion.user).toEqual("test@example.com");
        expect(newQuestion.title).toEqual("Question Title");
        expect(newQuestion.courseCode).toEqual("CPEN 321");
        expect(newQuestion.questionText).toEqual("A sample question.");
    });
});


describe("Question JSON test", () => {
    afterAll(() => {
        fastify.close();
    });

    test("Question fromJson constructor and toJson method working", async (done) => {
        var questionJSON = {
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
        }

        const qm = questionsModule({ mongo: fastify.mongo });

        const newQuestion = qm.Question.fromJson(questionJSON);

        expect(newQuestion.toJson()).toEqual(questionJSON);

        // modify the question, try again
        qm.helperAccepted = true
        
        expect(newQuestion.toJson().helperAccepted).toBe(true);
=======
const app = require("../../app");
const questionsModule = require("../../questions");

let qm;

const fastify = app.fastify;

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
        await collection.deleteOne({uuid: question.uuid});
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
>>>>>>> 9bdec1228ba5a5b2ea7d569d2699d4b04c730ea0
    });
});
