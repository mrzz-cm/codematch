"use strict";

/* eslint no-undef: "off" */

const app = require("../../app.js");
const userModule = require("../../user");
const questionsModule = require("../../questions");
const ru = require("../../utils/router");
const rc = ru.responseCodes;

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


describe("Account duplicate creation test", () => {
    const testUser = "testuser0@example.com";

    afterAll(async () => {
        const collection = await fastify.mongo.db.collection("users");
        await collection.deleteOne({ userId: testUser });
    });

    beforeAll(async () => {
        const user = um.User.newUser(testUser);
        await user.create();
    });

    test("Account duplicate creation test", async (done) => {
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

        expect(response.statusCode).toBe(rc.BAD_REQUEST);

        done();
    });
});


describe("Account modification test", () => {
    const testUser = "testUser@example.com";

    afterAll(async () => {
        const userCollection = await fastify.mongo.db.collection("users");
        await userCollection.deleteOne({ userId: testUser });
    });

    beforeAll(async () => {
        const user = um.User.newUser(testUser);
        await user.create();
    });

    test("Update location test", async (done) => {
        const response = await fastify.inject({
            method: "PUT",
            url: "/user/location/" + testUser,
            body: {
                longitude: -100,
                latitude: 100
            }
        });

        expect(response.statusCode).toBe(200);

        // check database
        const user = await um.User.retrieve(testUser);
        expect(user.location.longitude).toBe(-100);
        expect(user.location.latitude).toBe(100);

        done();
    });

    test("Update location non-existent user test", async (done) => {
        const response = await fastify.inject({
            method: "PUT",
            url: "/user/location/idontexist",
            body: {
                longitude: -100,
                latitude: 100
            }
        });

        expect(response.statusCode).toBe(rc.BAD_REQUEST);

        done();
    });

    test("Add course test", async (done) => {
        const response = await fastify.inject({
            method: "POST",
            url: "/user/add-course",
            body: {
                userId: testUser,
                courseId: "CPEN 321"
            }
        });

        expect(response.statusCode).toBe(200);

        // check database
        const user = await um.User.retrieve(testUser);
        expect(user.courses).toEqual(["CPEN 321"]);

        done();
    });

    test("Add course non-existent user test", async (done) => {
        const response = await fastify.inject({
            method: "POST",
            url: "/user/add-course",
            body: {
                userId: "idontexist",
                courseId: "CPEN 321"
            }
        });

        expect(response.statusCode).toBe(rc.BAD_REQUEST);

        done();
    });
});


describe("Getting user data", () => {
    const testUser = "testUser@example.com";

    afterAll(async () => {
        const userCollection = await fastify.mongo.db.collection("users");
        await userCollection.deleteOne({ userId: testUser });
    });

    beforeAll(async () => {
        const user = um.User.newUser(testUser);
        await user.create();
    });

    test("Getting user data", async (done) => {
        const response = await fastify.inject({
            method: "GET",
            url: "/user/" + testUser
        });

        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body).userId).toBe(testUser);

        done();
    });

    test("Getting non-existent user data", async (done) => {
        const response = await fastify.inject({
            method: "GET",
            url: "/user/idontexist"
        });

        expect(response.statusCode).toBe(rc.BAD_REQUEST);

        done();
    });
});


describe("Getting question data", () => {
    let questionId;
    const testQuestion = {
        uuid: "123",
        title: "test problem",
        courseCode: "CPEN 321",
        questionText: "A test problem",
        seeker: "testuser@example.com",
        creationTimestamp: 123,
        optimalHelper: "helper@example.com",
        helperNotifiedTimestamp: 124,
        helperAccepted: null,
        prevCheckedHelpers: [],
        finalHelper: null,
        questionState: "Waiting",
        finalScore: null
    };

    afterAll(async () => {
        const collection = await fastify.mongo.db.collection("questions");
        await collection.deleteOne({uuid: questionId});
    });

    beforeAll(async () => {
        const q = qm.Question.fromJson(testQuestion);
        await q.create();
        questionId = q.uuid;
    });

    test("Getting user data", async (done) => {
        const response = await fastify.inject({
            method: "GET",
            url: "/questions/" + questionId
        });

        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body).uuid).toBe(questionId);

        done();
    });

    test("Getting non-existent question data", async (done) => {
        const response = await fastify.inject({
            method: "GET",
            url: "/questions/idontexist"
        });

        expect(response.statusCode).toBe(rc.BAD_REQUEST);

        done();
    });
});


describe("Posting new question test", () => {

    let question;
    const testUser = "testuser1@example.com";
    const testUser2 = "testuser2@example.com";

    afterAll(async () => {
        const collection = await fastify.mongo.db.collection("questions");
        const userCollection = await fastify.mongo.db.collection("users");
        await collection.deleteOne({uuid: question.uuid});
        await userCollection.deleteOne({ userId: testUser });
        await userCollection.deleteOne({ userId: testUser2 });
    });

    beforeAll(async () => {
        const user = um.User.newUser(testUser);
        await user.create();
        const user2 = um.User.newUser(testUser2);
        await user2.create();
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

    test("Post new question non-existent user", async (done) => {
        const response = await fastify.inject({
            method: "POST",
            url: "/questions/create",
            body: {
                userId: "idontexist",
                title: "Test Question",
                courseCode: "CPEN 321",
                questionText: "A test question."
            }
        });

        expect(response.statusCode).toBe(rc.BAD_REQUEST);
        
        done();
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

    test("Offering help a question non-existent parameters test", async (done) => {
        const helpResponse = await fastify.inject({
            method: "POST",
            url: "/questions/accept",
            body: {
                userId: "idontexist",
                questionId: "idontexist",
            }
        });

        expect(helpResponse.statusCode).toBe(rc.BAD_REQUEST);

        done();
    });
});


describe("Rating a helper test", () => {

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

    test("Rating a helper", async (done) => {
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
        await fastify.inject({
            method: "POST",
            url: "/questions/accept",
            body: {
                userId: testHelper,
                questionId: question.uuid,
            }
        });

        // step three: seeker rates the helper
        const rateResponse = await fastify.inject({
            method: "POST",
            url: "/questions/close/" + testSeeker,
            body: {
                rating: 8
            }
        });

        expect(rateResponse.statusCode).toBe(200);

        // check rating wrote through
        var helperUser = await um.User.retrieve(testHelper);

        expect(helperUser.points).toBe(8);
        
        // check the question is resolved
        var seekerUser = await um.User.retrieve(testSeeker);
        expect(seekerUser.currentQuestion).toBe(null);
        expect(helperUser.currentQuestion).toBe(null);

        question = await qm.Question.retrieve(question.uuid);
        expect(question.questionState).toBe("Resolved");
        expect(question.finalScore).toBe(8);

        done();
    });
});

