const gcm = require("node-gcm");

const config = require("../config");

const SERVER_KEY = config.FCM_KEY;
const sender = new gcm.Sender(SERVER_KEY);

const userCollection = config.collections.users;

let mongo;

/**
 * Class representing a User
 */
class User {

    /**
     * @param {string}      userId
     * @param {number}      points
     * @param {string[]}    courses
     * @param {string[]}    questionsPosted
     * @param {string[]}    questionsHelped
     * @param {number}      lastOnline
     * @param {string}      currentQuestion
     * @param {string}      token
     * @param {Object}      location
     * @param {string}      fcmToken
     */
    constructor(userId, points, courses, questionsPosted, questionsHelped,
        lastOnline, currentQuestion, token, location, fcmToken) {
        this._userId = userId;
        this._points = points;
        this._courses = courses;

        this._questionsPosted = questionsPosted;
        this._questionsHelped = questionsHelped;

        this._lastOnline = lastOnline;
        this._currentQuestion = currentQuestion;
        this._token = token;

        this._location = location;
        this._fcmToken = fcmToken;
    }

    /**
     * Create a new User with no previous history
     * @param {string} email
     */
    static newUser(email) {
        return new User(email, 0, [],
            [], [], Date.now(),
            null, null,
            { longitude: 0, latitude: 0}, null);
    }

    /**
     * Creates a new User from a JSON object from the database
     * @param {object} jsonUser
     */
    static fromJson(jsonUser) {
        return new User(
            jsonUser.userId, jsonUser.points, jsonUser.courses,
            jsonUser.questionsPosted, jsonUser.questionsHelped,
            jsonUser.lastOnline, jsonUser.currentQuestion,
            jsonUser.token,
            jsonUser.location,
            jsonUser.fcmToken
        );
    }

    /**
     * Get the location
     * @returns {Object} location
     */
    get location() {
        return this._location;
    }

    /**
     * Set the location
     * @param {Object} location
     */
    set location(location) {
        this._location = location;
    }

    /**
     * Get the userId
     * @returns {string} userId
     */
    get userId() {
        return this._userId;
    }

    /**
     * Set the userId
     * @param {string} userId
     */
    set userId(userId) {
        this._userId = userId;
    }

    /**
     * Get the points
     * @returns {string} The points
     */
    get points() {
        return this._points;
    }

    /**
     * Set the points
     * @param {number} points
     */
    set points(points) {
        this._points = points;
    }

    /**
     * Get the user's courses
     * @returns {string[]} course codes that user has taken
     */
    get courses() {
        return this._courses;
    }

    /**
     * Add a course
     * @param {string} courseId
     */
    addCourse(courseId) {
        if (!this._courses.includes(courseId)) {
            this._courses.push(courseId);
        }
    }

    /**
     * Get the list of question IDs the user has posted as a question
     * for
     * @returns {string[]} question IDs that the user has posted
     */
    get questionsPosted() {
        return this._questionsPosted;
    }

    /**
     * Get the list of question IDs the user has helped with
     * @returns {string[]} question IDs that the user has helped
     */
    get questionsHelped() {
        return this._questionsHelped;
    }

    /**
     * Get the timestamp when the user was last detected to be online
     * @returns {number} the timestamp when the user was last online
     */
    get lastOnline() {
        return this._lastOnline;
    }

    /**
     * Set the timestamp for which the user was last online
     * @param {number} timestamp
     */
    set lastOnline(timestamp) {
        this._lastOnline = timestamp;
    }

    /**
     * Get the current question the user is posting or helping for
     * @returns {string} the question ID
     */
    get currentQuestion() {
        return this._currentQuestion;
    }

    /**
     * Sets the current question the user is posting or helping for
     * @param {string} questionId
     */
    set currentQuestion(questionId) {
        this._currentQuestion = questionId;
    }

    get token() {
        return this._token;
    }

    set token(token) {
        this._token = token;
    }

    get fcmToken() {
        return this._fcmToken;
    }

    set fcmToken(fcmToken) {
        this._fcmToken = fcmToken;
    }

    /**
     * Serializes the object into JSON so it can be stored into MongoDB
     * @returns {Object} the JSON blob representing the user
     */
    toJson() {
        return {
            userId: this._userId,
            points: this._points,
            courses: this._courses,
            questionsPosted: this._questionsPosted,
            questionsHelped: this._questionsHelped,
            lastOnline: this._lastOnline,
            currentQuestion: this._currentQuestion,
            token: this._token,
            location: this._location,
            fcmToken: this._fcmToken
        };
    }

    /**
     * Check if user exists
     *
     * @param userId
     * @returns {Promise<boolean>}
     */
    static async exists(userId) {
        try {
            const count = await mongo.db.collection(userCollection)
                .find({"userId": {$exists: true, $eq: userId}})
                .count();
            return count !== 0;
        } catch (err) {
            throw new Error(
                `Failed to check for ${userId} in database ${err}`
            );
        }
    }

    /**
     * Adds a user to the database.
     *
     * @returns {Promise<any>}
     */
    async create() {
        const collection = await mongo.db.collection(userCollection);
        const jsonData = this.toJson();
        try {
            await collection.createIndexes(
                [ { key: { userId: 1 } } ],
                { unique: true }
            );
            return collection.insertOne(jsonData);
        } catch (err) {
            throw new Error(
                `Failed to insert ${jsonData.userId} into the collection ${err}`
            );
        }
    }

    /**
     * Updates the user in the database.
     *
     * @param {object} update
     * @returns {Promise<any>}
     */
    async update(update) {
        const collection = await mongo.db.collection(userCollection);
        try {
            return collection.findOneAndUpdate({userId: this._userId}, update);
        } catch (err) {
            throw new Error(
                `Failed to update user ${this._userId}`
            );
        }
    }

    /**
     * Retrieve a user from database
     *
     * @param {string} userId
     * @returns {Promise<any>}
     */
    static async retrieve(userId) {
        const collection = await mongo.db.collection(userCollection);
        try {
            return collection.findOne({ userId });
        } catch (err) {
            throw new Error(
                `Failed to retrieve user ${userId}`
            );
        }
    }

    /**
     * Retrieve all users from database.
     * @returns {Promise<User[]>} all users
     */
    // static async getAllUsers() {
    //     let users;
    //     try {
    //         users = await mongo.db.collection(userCollection)
    //             .find({})
    //             .toArray();
    //     } catch (err) {
    //         throw new Error("Failed getting all users");
    //     }
    //     return users.map((q) => (this.fromJson(q)));
    // }

    /**
     * Get 'sanitized' user in JSON format removing secret fields
     *
     * @param userId
     * @returns {Promise<any>}
     */
    static async sanitizedJson(userId) {
        let userJson;
        try {
            userJson = await User.retrieve(userId);
        } catch (err) {
            throw new Error(err);
        }

        if (!userJson) {
            throw new Error("No user found");
        }

        // remove the token fields before sending data back to client
        userJson.token = null;
        userJson.fcmToken = null;

        return userJson;
    }

    /**
     * Registers the user for FCM notifications.
     * 
     * @param {string} userId 
     * @param {string} fcmToken 
     */
    static async registerForNotifications(userId, fcmToken) {
        let userJson;
        try {
            userJson = await User.retrieve(userId);
        } catch (err) {
            return new Error(err);
        }

        if (!userJson) {
            return new Error(
                `Cannot find user ${userId} to register for notifications`);
        }

        const user = User.fromJson(userJson);
        user.fcmToken = fcmToken;

        // update database
        try {
            return await user.update({$set: { fcmToken }});
        } catch (err) {
            return new Error(err);
        }
    }

    /**
     * Sends a notification to the user.
     * 
     * @param {string} userId 
     * @param {string} title 
     * @param {string} body 
     * @param {Object} data 
     */
    static async sendNotification(userId, title, body, data) {

        // create message
        const message = new gcm.Message({
            notification: {
                title,
                body,
                data
            }
        });

        // get user

        let user;
        try {
            user = await User.retrieve(userId);
        } catch (err) {
            return new Error(err);
        }

        if (!user) {
            return new Error(`Cannot find user ${userId}`);
        }

        if (!user.fcmToken) {
            return new Error("Cannot get user FCM token");
        }

        const fcmToken = user.fcmToken;

        // Specify which registration IDs to deliver the message to
        const regTokens = [fcmToken];

        return new Promise(
            (resolve, reject) => {
                // Actually send the message
                sender.send(message, {
                    registrationTokens: regTokens
                }, (err, result) => {
                    if (err) {reject(err);}
                    resolve(result);
                });
            }
        );
    }

}

module.exports = function (options) {
    mongo = options.mongo;

    const module = {};

    module.User = User;

    return module;
};
