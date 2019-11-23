const multer = require("fastify-multer");
const mime = require("mime");

const config = require("../config");

function uploadname(file) {
    const now = Date.now();
    return `${file.fieldname}-${now}.${mime.getExtension(file.mimetype)}`;
}

const storageHandler = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, config.fileSettings.uploadDirectory)
    },
    filename(req, file, cb) {
        cb(null, uploadname(file))
    }
});

module.exports = {
    options: {},
    storageHandler,
    multer
};
