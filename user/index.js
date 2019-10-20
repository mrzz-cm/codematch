const req = require('request');
var _db;

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
     * @param {string}  course_id
     */
    add_course(course_id) {
        if (!this._courses.includes(course_id)) {
            this._courses.push(course_id);
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
     * @param {string} question_id
     */
    set currentQuestion(question_id) {
        this._currentQuestion = question_id;
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
}

// module.exports = {
//     User: User,
//     Helper: Helper
// };


/**
 * User Functions
 */

 /**
  * Creates a new user from a client request.
  */
function createUser(request, reply) {
    const u_data = request.body;

    // get the user's google account information from google
    const google_token = u_data.google_token;

    // send request to google
    req({
        url: 'https://openidconnect.googleapis.com/v1/userinfo',
        method: 'GET',
        qs: { scope: "openid email"},
        headers: {
            Authorization: 'Bearer ' + google_token
        },
        json: true
    }, function (err, res, data) {
        if (err || res.statusCode !== 200) {
            reply.status(res.statusCode);
            reply.send(err);
            return
        }
        
        // get the user's email
        const email = data.email;
        if (!email) {
            reply.status(401);
            reply.send();
            return;
        }

        // make a new account
        const newUser = User.newUser(email);

        console.log(newUser);

        // test toJSON
        console.log(newUser.toJson());

        // store to database
        addToDatabase(newUser)

        // done
        reply.status(200);
        reply.send();
    });
}


/**
 * Adds a user to our database.
 * @param {User} user
 */
function addToDatabase(user) {
    const collection = _db.collection('users');

    const jsonData = user.toJson();

    collection.insertOne(jsonData, function (err, result) {
        assert.ok(err === null);
        console.log("Inserted user " + jsonData.userId + " into the collection");
    });
}

module.exports = function (options) {
    _db = options.db;

    var module = {};

    module.createUser = createUser;
    module.addToDatabase = addToDatabase;

    return module;
}
