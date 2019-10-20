const authentication = require("../authentication");

const userCollection = 'users';

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
        return new Helper('', false);
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
     */
    constructor(userId, points, courses,
        questionsPosted, questionsHelped,
        lastOnline, currentQuestion) {
        this._userId = userId;
        this._points = points;
        this._courses = courses;

        this._questionsPosted = questionsPosted;
        this._questionsHelped = questionsHelped;

        this._lastOnline = lastOnline;
        this._currentQuestion = currentQuestion;
    }

    /**
     * Create an Empty User
     * @returns {User} Empty User
     */
    static emptyUser() {
        return new User('', 0);
    }

    /**
     * Create a new User with no previous history
     * @param {string} email
     */
    static newUser(email) {
        return new User(email, 0, [],
            [], [], Date.now(), null);
    }

    /**
     * Creates a new User from a JSON object from the database
     * @param {object} json_obj 
     */
    static fromJson(json_obj) {
        return new User(
            json_obj.userId, json_obj.points, json_obj.courses,
            json_obj.questionsPosted, json_obj.questionsHelped,
            json_obj.lastOnline, json_obj.currentQuestion
        );
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

    /**
     * Serializes the object into JSON so it can be stored into MongoDB
     * @returns {Object} the JSON blob representing the user
     */
    toJson() {
        return {
            userId: this.userId,
            points: this.points,
            courses: this.courses,
            questionsPosted: this.questionsPosted,
            questionsHelped: this.questionsHelped,
            lastOnline: this.lastOnline,
            currentQuestion: this.currentQuestion
        }
    }

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
                    console.log(`Failed to insert ${jsonData.userId} into the collection`);
                } else {
                    console.log(`Inserted user  ${jsonData.userId} into the collection`);
                }
                callback(err)
            })
        });
    }

    /**
     * Retrieve a user from database.
     * @param {string} email
     * @param {function} callback
     */
    static retrieve(email, callback) {
        const collection = mongo.db.collection(userCollection);
        collection.findOne({ userId: email }, function (err, result) {
            if (err !== null) {
                console.log(`Failed to retrieve ${email} from the collection`);
            } else {
                console.log(`Retrieved user ${result} from the collection`);
            }
            callback(err, result)
        })
    }

}

/**
 * User Functions
 */

 /**
  * Creates a new user from a client request.
  */
function createUser(googleToken, callback) {
    console.log("Token: " + googleToken);
    authentication.requestEmail(googleToken, callback);
}

module.exports = function (options) {
    mongo = options.mongo;

    const module = {};

    module.createUser = createUser;
    module.User = User;

    return module;
};
