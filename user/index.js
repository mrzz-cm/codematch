const geolib = require("geolib");

const userCollection = "users";
let mongo;

/**
 * Class representing a Helper
 */
class Helper {
    /**
     * @param {User} user
     * @param {boolean} accepted
     */
    constructor(user, accepted) {
        this._user = user;
        this._accepted = accepted;
    }

    /**
     * @returns {Helper} Empty helper
     */
    static emptyHelper() {
        return new Helper("", false);
    }

    /**
     * Get the user
     * @returns {User} The user
     */
    get user() {
        return this._user;
    }

    /**
     * Set the user
     * @param {User} user
     */
    set user(user) {
        this._user = user;
    }

    /**
     * Get accepted
     * @returns {boolean} accepted
     */
    get accepted() {
        return this._accepted;
    }

    /**
     * Set accepted
     * @param {boolean} accepted
     */
    set accepted(accepted) {
        this._accepted = accepted;
    }

}

/* TODO: Decide on weights */
const LOCATION_WEIGHT = 1;
const LAST_ACTIVE_WEIGHT = 1;
const COURSE_CODE_WEIGHT = 1;
const USER_RATING_WEIGHT = 1;

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
     * @param {Location}    location
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
            null, null, new Location(0, 0), null);
    }

    /**
     * Creates a new User from a JSON object from the database
     * @param {object} jsonUser
     */
    static fromJson(jsonUser) {
        console.log(jsonUser)
        return new User(
            jsonUser.userId, jsonUser.points, jsonUser.courses,
            jsonUser.questionsPosted, jsonUser.questionsHelped,
            jsonUser.lastOnline, jsonUser.currentQuestion,
            jsonUser.token,
            Location.fromJson(jsonUser.location),
            jsonUser.fcmToken
        );
    }

    /**
     * Get the location
     * @returns {Location} location
     */
    get location() {
        return this._location;
    }

    /**
     * Set the location
     * @param {Location} location
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
        this._fcmToken = fcmToken
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
            location: this._location.toJson(),
            fcmToken: this._fcmToken
        };
    }

    /**
     * Check if a user exists
     *
     * @param userId
     * @returns {Promise<boolean>}
     */
    static async exists(userId) {
        const count = await mongo.db.collection(userCollection)
            .find({ "userId": { $exists: true, $eq: userId } })
            .count();

        return count !== 0;
    }

    /**
     * Adds a user to our database.
     * @param {function} callback
     */
    create(callback) {
        const collection = mongo.db.collection(userCollection);

        const jsonData = this.toJson();
        collection.ensureIndex({ userId: 1 }, { unique: true }, () => {
            collection.insertOne(jsonData, function (err, result) {
                if (err !== null) {
                    console.log(
                        `Failed to insert ${jsonData.userId} into users`);
                } else {
                    console.log(
                        `Inserted user ${jsonData.userId} into users`);
                }
                callback(err);
            });
        });
    }

    /**
     * Updates the user in the database.
     * @param {object}      update
     * @param {function}    callback
     */
    update(update, callback) {
        const collection = mongo.db.collection(userCollection);

        collection.findOneAndUpdate(
            { userId: this._userId },
            update,
            callback
        );
    }

    /**
     * Retrieve a user from database.
     * @param {string} email
     * @param {function} callback
     */
    static retrieve(email, callback) {
        mongo.db.collection(userCollection).findOne({
            userId: email
        }, (err, result) => {
            if (err !== null) {
                console.log(`Failed to retrieve ${email} from the collection`);
            } else {
                console.log(`Retrieved user ${result} from the collection`);
            }
            callback(err, result);
        });
    }

    /**
     * Retrieve all users from database.
     * @returns {Promise<User[]>} all users
     */
    static async getAllUsers() {
        const r = await mongo.db.collection(userCollection)
            .find({})
            .toArray();
        return r.map((q) => (this.fromJson(q)));
    }

    static rating(question, user) {
        return (
            (this.location.distance(user.location) * LOCATION_WEIGHT) +
            (this.lastOnline * LAST_ACTIVE_WEIGHT) +
            (this.points * USER_RATING_WEIGHT) +
            (this._courses.includes(question.courseCode) ? COURSE_CODE_WEIGHT : 0)
        );
    }

    static sanitizedJson(userId, callback) {
        User.retrieve(userId, function(err, data) {
            if (err || !data) {
                callback(err, data);
                return;
            }

            // remove the token fields before sending data back to client
            data.token = null;
            data.fcmToken = null;
            callback(err, data);
        });
    }
}

/**
 * Create a Location
 */
class Location {
    /**
     * @param {number} latitude
     * @param {number} longitude
     * @param {number} timestamp
     */
    constructor(latitude, longitude, timestamp) {
        this._latitude = latitude;
        this._longitude = longitude;
        // this._timestamp = timestamp;
    }

    toJson() {
        return { latitude: this._latitude, longitude: this._longitude }
    }

    static fromJson(jsonLocation) {
        return new Location(jsonLocation.latitude, jsonLocation.longitude, 0);
    }

    /**
     * calculates the distance between two locations in kilometers
     *
     * @param {Location} location
     */
    distance(location) {
        return geolib.getDistance(this.toJson(), location.toJson());
    }
}

function getUser(userId, callback) {
    User.retrieve(userId, function(err, data) {
        if (err || !data) {
            callback(err, data);
            return;
        }

        // remove the token fields before sending data back to client
        data.token = null;
        data.fcmToken = null;
        callback(err, data);
    });
}

module.exports = function (options) {
    mongo = options.mongo;

    const module = {};

    module.User = User;
    module.getUser = getUser;

    return module;
};
