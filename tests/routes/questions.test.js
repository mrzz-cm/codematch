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

    User.prototype.update = jest.fn(() => {});

    const module = { User: User };

    return module;
});



/* Questions module mock */


jest.mock("../../questions", () => function() {
    class Question {
        constructor(uuid, title, courseCode, questionText,
            seeker, creationTimestamp,
            optimalHelper, helperNotifiedTimestamp, helperAccepted,
            prevCheckedHelpers, finalHelper,
            questionState, finalScore) {
            
            this.uuid = uuid;
            this.title = title;
            this.courseCode = courseCode;
            this.questionText = questionText;
            this.seeker = seeker;
            this.creationTimestamp = creationTimestamp;
            this.optimalHelper = optimalHelper;
            this.helperNotifiedTimestamp = helperNotifiedTimestamp;
            this.helperAccepted = helperAccepted;
            this.prevCheckedHelpers = prevCheckedHelpers;
            this.finalHelper = finalHelper;
            this.questionState = questionState;
            this.finalScore = finalScore;
        }
    }
    
    Question.newQuestion = jest.fn(function (user, title, courseCode, questionText) {
        return new Question("question1", title, courseCode, questionText, 
            user, 123456789, null, null, null, [], null, "Unmatched", null);
    });
    
    Question.fromJson = jest.fn(function (jsonObj) {
        return new Question(
            jsonObj.uuid, jsonObj.title, jsonObj.courseCode, jsonObj.questionText,
            jsonObj.seeker, jsonObj.creationTimestamp,
            jsonObj.optimalHelper, jsonObj.helperNotifiedTimestamp,
            jsonObj.helperAccepted, jsonObj.prevCheckedHelpers,
            jsonObj.finalHelper, jsonObj.questionState,
            jsonObj.finalScore
        );
    });

    Question.retrieve = jest.fn(function () {
        // TODO
    });
    
    Question.prototype.create = jest.fn(() => {});
    Question.prototype.update = jest.fn(() => {});

    const module = { Question: Question };

    return module;
});


/* Matching module mock */


jest.mock("../../matching", () => function() {
    class Match {
        constructor (question) {
            this.question = question;
        }
    }
    
    Match.optimalHelper = jest.fn(async function() {
        // return the other user
        if (this.question.seeker == "user0@example.com") {
            return { userId: "user1@example.com", rating: 1 };
        } else if (this.question.seeker == "user1@example.com") {
            return { userId: "user0@example.com", rating: 1 };
        }
    });

    const module = { Match: Match };

    return module;
});


beforeAll(async () => {
    await fastify.ready();
});

afterAll(() => {
    fastify.close();
});

describe("Post question test", () => {

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

        done();
    });
});
