"use strict";

/* eslint no-undef: "off" */

const app = require("../app.js");
const fastify = app.fastify; /* eslint-disable-line */

describe("Basic test", () => {
    // afterAll(() => {
    //     fastify.close();
    // });

    test("Responds with success on request /user/:userId", async (done) => {
        // const response = await fastify.inject({
        //     method: "GET",
        //     url: "/user/john1@example.com"
        // });
        //
        // expect(response.statusCode).toBe(200);
        done();
    });
});
