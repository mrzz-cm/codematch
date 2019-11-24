"use strict";

/* eslint no-undef: "off" */
const app = require("../../app");
const fastify = app.fastify;


/* User module mock */

jest.mock("../../user", () => function() {
    /* mock database with two users: user0 (seeker) and user1 (helper) */
    const seekerUser = {
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
        "userId": "user0@example.com"
    };

    const helperUser = {
        "_id": "abcd",
        "courses": [],
        "currentQuestion": null,
        "fcmToken": null,
        "lastOnline": 123,
        "location": {
            "latitude": -123.22,
            "longitude": 49.29
        },
        "points": 2,
        "questionsHelped": [],
        "questionsPosted": [],
        "token": null,
        "userId": "user1@example.com"
    };


    /* mock User class */
    class User {
        constructor(userId, points, courses, questionsPosted, questionsHelped,
            lastOnline, currentQuestion, token, location, fcmToken) {
            this.userId = userId;
            this.points = points;
            this.courses = courses;

            this.questionsPosted = questionsPosted;
            this.questionsHelped = questionsHelped;

            this.lastOnline = lastOnline;
            this.currentQuestion = currentQuestion;
            this.token = token;

            this.location = location;
            this.fcmToken = fcmToken;
        }
    }

    User.exists = jest.fn(async function (userId) {
        return (userId == "user0@example.com") || (userId == "user1@example.com");
    });

    User.fromJson = jest.fn(function (jsonUser) {
        return new User(
            jsonUser.userId, jsonUser.points, jsonUser.courses,
            jsonUser.questionsPosted, jsonUser.questionsHelped,
            jsonUser.lastOnline, jsonUser.currentQuestion,
            jsonUser.token,
            jsonUser.location,
            jsonUser.fcmToken
        );
    });

    User.retrieve = jest.fn(async function (userId) {
        if (userId == "user0@example.com") {
            return seekerUser;
        } else if (userId == "user1@example.com") {
            return helperUser;
        } else {
            throw Error("User not found in mock user module");
        }
    });

    User.sendNotification = jest.fn( async function () {} );

    User.prototype.update = jest.fn( async function () {} );

    const module = { User: User };

    return module;
});


/* Matching module mock */


jest.mock("../../matching", () => function() {
    class Match {
        constructor (question) {
            this.question = question;
        }
    }
    
    Match.prototype.optimalHelper = jest.fn(async function() {
        // return the other user
        if (this.question.seeker == "user0@example.com") {
            return { userId: "user1@example.com", rating: 1 };
        } else {
            return { userId: "user0@example.com", rating: 1 };
        }
    });

    const module = { Match: Match };

    return module;
});

const questionsModule = require("../../questions");
let qm;

beforeAll(async () => {
    await fastify.ready();
    qm = questionsModule({ mongo: fastify.mongo });
});

afterAll(() => {
    fastify.close();
});

describe("Post question test", () => {
    let questionId;

    afterAll(async () => {
        const collection = await fastify.mongo.db.collection("questions");
        await collection.deleteOne({uuid: questionId});
    });

    test("Post a new question successfully", async (done) => {
        const response = await fastify.inject({
            method: "POST",
            url: "/questions/create",
            body: {
                userId: "user0@example.com",
                title: "Test question",
                courseCode: "CPEN 321",
                questionText: "A sample question."
            }
        });

        expect(response.statusCode).toBe(200);

        // check question is in database
        questionId = JSON.parse(response.body).uuid;
        expect(questionId).toBeTruthy();

        const q = await qm.Question.retrieve(questionId);

        console.log(q);

        expect(q.seeker).toBe("user0@example.com");
        expect(q.title).toBe("Test question");

        done();
    });
});
