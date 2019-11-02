const winston = require("winston");
const config = require("../config");

const logger = winston.createLogger({
    level: config.logLevel || "info",
    format: winston.format.json(),
    defaultMeta: {},
    transports: [
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

/**
 * Logger Module
 */

module.exports = {
    logger: logger
};
