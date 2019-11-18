/**
 * Convenience error handler
 *
 * @param reply
 * @param code
 * @param err
 * @returns {*}
 */
function errCheck(reply, code, err) {
    if (err) {
        reply.status(code);
        reply.send(err);
    }
    return err;
}

const responseCodes = {
    // 2xx Success
    OK: 200,

    // 4xx Client Error
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    FORBIDDEN: 403,

    // 5xx Server Error
    INTERNAL_SERVER_ERROR: 500,
    NOT_IMPLEMENTED: 501,
};

module.exports = {
    errCheck,
    responseCodes
};
