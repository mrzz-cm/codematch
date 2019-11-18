"use strict";

/* eslint no-undef: "off" */

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
    });
});
