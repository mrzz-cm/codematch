function errCheck(reply, code, err) {
    if (err) {
        reply.status(code);
        reply.send(err);
    }
    return err;
}

module.exports = {
    errCheck: errCheck
};