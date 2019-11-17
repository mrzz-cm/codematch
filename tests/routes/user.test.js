"use strict";

/* eslint no-undef: "off" */

const app = require("../../app");
const fastify = app.fastify;

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
                "_id": "5dd0c159655e815a5740e06b",
                "courses": [],
                "currentQuestion": null,
                "fcmToken": null,
                "lastOnline": 1573962073665,
                "location": {
                    "latitude": -123.24,
                    "longitude": 49.26
                },
                "points": 0,
                "questionsHelped": [],
                "questionsPosted": [],
                "token": null,
                "userId": "user0@example.com"
            }
        );

        done();
    });
});
