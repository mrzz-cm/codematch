const userModule = require("../user");

var gcm = require('node-gcm');
const SERVER_KEY = "SERVER_KEY_HERE";
var sender = new gcm.Sender(SERVER_KEY);

var message = new gcm.Message({
    data: { key1: 'msg1' }
});

// Specify which registration IDs to deliver the message to
var regTokens = ['1'];
 
// Actually send the message
sender.send(message, { registrationTokens: regTokens }, function (err, response) {
    if (err) console.error(err, response);
    else console.log(response);
});

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