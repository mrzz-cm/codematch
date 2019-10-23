const userModule = require("../user");
const config = require("../config");

var gcm = require('node-gcm');
const SERVER_KEY = config.FCM_KEY;
var sender = new gcm.Sender(SERVER_KEY);

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
    });
}

function sendUserNotification(userId, title, body, data, callback) {
    
    // create message
    const message = new gcm.Message({
        notification: {
            title: title,
            body: body,
            data: data
        }
    });

    // get user
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

        if (!result.fcmToken) {
            callback("cannot get user FCM token", 0);
            console.log(userId);
            return;
        }

        const fcmToken = result.fcmToken;

        // Specify which registration IDs to deliver the message to
        var regTokens = [fcmToken];
        
        // Actually send the message
        sender.send(message, { registrationTokens: regTokens }, function(err, result) {
            console.log(err, result);
            callback(err, result);
        });
    });
}

module.exports = function (options) {
    mongo = options.mongo;

    const module = {};

    module.registerUserForNotifications = registerUserForNotifications;
    module.sendUserNotification = sendUserNotification;

    return module;
};