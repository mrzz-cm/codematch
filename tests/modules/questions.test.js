"use strict";

/* eslint no-undef: "off" */

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
    });
});
