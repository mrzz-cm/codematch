const userModule = require("../user");

let mongo;

function registerUserForNotifications(userId, fcmToken, callback) {
    const um = userModule({ mongo: mongo });
    um.User.retrieve(userId, function(err, result) {
        if (err) {
            callback(err, result);
            return;
        }

        if (!result) {
            callback("cannot find user", 0);
            console.log(userId);
            return;
        }

        var user = um.User.fromJson(result);

        user.fcmToken = fcmToken;

        // update database
        user.update(
            { $set: {fcmToken: fcmToken} },
            callback
        );
    })
}

module.exports = function (options) {
    mongo = options.mongo;

    const module = {};

    module.registerUserForNotifications = registerUserForNotifications;

    return module;
};