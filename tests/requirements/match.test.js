"use strict";

/* eslint no-undef: "off" */
const app = require("../../app");
const logger = require("../../logger").logger;

const fastify = app.fastify;
const { performance } = require("perf_hooks");

beforeAll(async () => {
    await fastify.ready();
});

afterAll(() => {
    fastify.close();
});

describe("Check matching functional requirements", () => {

    test("Run matching in under 100 ms", async (done) => {
        const t0 = performance.now();

        await fastify.inject({
            method: "POST",
            url: "/questions/create",
            body: {
                userId: "seekeruser0@example.com",
                title: "Test question",
                courseCode: "CPEN 321",
                questionText: "A sample question."
            }
        });

        const t1 = performance.now();
        const time = t1 - t0;

        logger.info("Time to Run matching", { time });

        // Matching  algorithm and database lookup under 100 ms
        expect(time).toBeLessThan(100);

        done();
    });
});

describe("Check user creation non-functional requirement", () => {

    test("Run user creation in under 30 ms", async (done) => {
        const t0 = performance.now();
        const testUser = "nfrusertestuser@example.com";

        await fastify.inject({
            method: "POST",
            url: "/user/register",
            body: {
                test_email: testUser,
                longitude: 100,
                latitude: -100,
                access_token: "NOT_A_TOKEN"
            }
        });

        const t1 = performance.now();
        const time = t1 - t0;

        logger.info("Time to run user creation", { time });

        // API response time to input data under 30 ms
        expect(time).toBeLessThan(30);

        done();
    });
});
