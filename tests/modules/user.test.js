"use strict";

/* eslint no-undef: "off" */

const app = require("../../app");
const userModule = require("../../user");

let um;

const fastify = app.fastify;

beforeAll(async () => {
    await fastify.ready();
    um = userModule({ mongo: fastify.mongo });
});

afterAll(() => {
    fastify.close();
});

describe("User creation test", () => {
    const tu = "testuser@example.com";

    afterAll(async () => {
        const collection = await fastify.mongo.db.collection("users");
        await collection.deleteOne({userId: tu});
    });

    test("Checks user is created", async (done) => {
        const user = um.User.newUser(tu);

        /* Make sure removed in last run */

        /* eslint-disable-next-line */
        const userExists = await um.User.exists(tu);
        expect(userExists).toBeFalsy();

        user.create()
            /* eslint-disable-next-line */
            .then(() => um.User.exists(tu))
            .then((result) => expect(result).toBeTruthy())
            .then(() => done());
    });
});

describe("User update test", () => {
    const tu = "testuser@example.com";
    let user;

    beforeEach(async () => {
        user = um.User.newUser(tu);
        await user.create();
    });

    afterAll(async () => {
        const collection = await fastify.mongo.db.collection("users");
        await collection.deleteOne({userId: tu});
    });

    test("Checks user is updated", async (done) => {
        const courses = [ "CPEN321" ];

        /* Make sure created properly */
        expect(user.toJson().userId).toBe(tu);

        user.update({ $set: { courses } })
            .then(() => um.User.retrieve(tu))
            .then((result) => (
                expect(result.courses).toStrictEqual(courses)
            ))
            .then(() => done());
    });
});


describe("User Json test", () => {

    test("User fromJson constructor and toJson method working", async (done) => {
        const userJson = {
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
            "userId": "testUser"
        };

        const newUser = um.User.fromJson(userJson);

        expect(newUser.toJson()).toEqual(userJson);

        // modify the user, try again
        newUser.currentQuestion = "questionId";

        expect(newUser.toJson().currentQuestion).toBe("questionId");

        done();
    });
});
