"use strict";

/* eslint no-undef: "off" */

const app = require("../app.js");
const fastify = app.fastify; /* eslint-disable-line */

describe("Basic test", () => {
    afterAll(() => {
        fastify.close();
    });

    test("Responds with success on request /user/:userId", async (done) => {
        const response = await fastify.inject({
            method: "GET",
            url: "/user/user0@example.com"
        });

        expect(response.statusCode).toBe(200);

        const responseBody = JSON.parse(response.body);
        expect(responseBody).toEqual(
            {
                "_id": "5db533dc1c29471f985ad0df",
                "userId": "user0@example.com",
                "points": 0,
                "courses": [],
                "questionsPosted": [],
                "questionsHelped": [],
                "lastOnline": 1572156380007,
                "currentQuestion": null,
                "token": null,
                "location": {"latitude": 0, "longitude": 0},
                "fcmToken": null
            }
        );

        done();
    });
});
