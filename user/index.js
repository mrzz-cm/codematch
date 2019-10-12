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
     * @param {string} userId
     * @param {number} points
     */
    constructor(userId, points) {
        this._userId = userId;
        this._points = points;
    }

    /**
     * Adds a new user to the database.
     * @throws Error if user couldn't be added.
     */
    create() {

    }

    /**
     * Deletes a user from the database.
     * @throws Error if user couldn't be deleted.
     */
    delete() {

    }

    /**
     * Create an Empty User
     * @returns {User} Empty User
     */
    static emptyUser() {
        return new User('', 0);
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
}

module.exports = {
    User: User,
    Helper: Helper
};
