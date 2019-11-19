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
        expect(await um.User.exists(tu)).toBeFalsy();

        user.create()
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

        user.update({ $set: { courses: courses } })
            .then(() => um.User.retrieve(tu))
            .then((result) => (
                expect(result.courses).toStrictEqual(courses)
            ))
            .then(() => done());
    });
});
