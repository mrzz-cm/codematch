"use strict";

/* eslint no-undef: "off" */

const app = require("../../app");
const userModule = require("../../user");

const fastify = app.fastify;

let um;

describe("Basic test", () => {
    beforeEach(async () => {
        await fastify.ready();
        um = userModule({ mongo: fastify.mongo })
    });

    afterAll(() => {
        fastify.close();
    });

    test("Checks user is created", async (done) => {
        const tu = "testuser@example.com";
        const user = um.User.newUser(tu);

        user.create()
            .then(() => um.User.exists(tu))
            .then((result) => expect(result).toBeTruthy())
            .then(() => done());
    });

});
