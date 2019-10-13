const userModule = require("../user");

/**
 * Class representing a Question
 */
class Question {

    /**
     * @param {User} user
     * @param {string} title
     * @param {string} imageId
     * @param {string} courseCode
     * @param {boolean} resolved
     */
    constructor(user, title, imageId, courseCode, resolved) {
        this._user = user;
        this._title = title;
        this._imageId = imageId;
        this._courseCode = courseCode;
        this._uuid = "GENERATE GUID HERE"; // TODO
        this._helper = Helper.emptyHelper();
        this._resolved = resolved;
    }

    /**
     * Get the userId
     * @return {string} The userId.
     */
    get user() {
        return this._user;
    }

    /**
     * Set the userId
     * @param {string} user
     */
    set user(user) {
        this._user = user;
    }

    /**
     * Get the uuid
     * @return {string} The userId.
     */
    get uuid() {
        return this._uuid;
    }

    /**
     * Set the uuid
     * @param {string} uuid
     */
    set uuid(uuid) {
        this._uuid = uuid;
    }

    /**
     * Get the title
     * @return {string} The title.
     */
    get title() {
        return this._title;
    }

    /**
     * Set the title
     * @param {string} title
     */
    set title(title) {
        this._title = title;
    }

    /**
     * Get the courseCode
     * @return {string} The courseCode.
     */
    get courseCode() {
        return this._courseCode;
    }

    /**
     * Set the courseCode
     * @param {string} courseCode
     */
    set courseCode(courseCode) {
        this._courseCode = courseCode;
    }

    /**
     * Get the imageId
     * @return {string} The imageId.
     */
    get imageId() {
        return this._imageId;
    }

    /**
     * Set the imageId
     * @param {string} imageId
     */
    set imageId(imageId) {
        this._imageId = imageId;
    }


    /**
     * Get the helper
     * @return {Helper} The helper.
     */
    get helper() {
        return this._helper;
    }

    /**
     * Sets the current helper for a question
     * @param {Helper} helper
     */
    set helper(helper) {
        this._helper = helper;
    }

    /**
     * Get resolved
     * @return {boolean} resolved
     */
    get resolved() {
        return this._resolved;
    }

    /**
     * Set resolved
     * @param {boolean} resolved
     */
    set resolved(resolved) {
        this._resolved = resolved;
    }

    /**
     * Posts a new question to the questions database.
     * @throws Error if question couldn't be posted.
     */
    post() {
        // TODO
        if (null) {
            throw new Error("...");
        }
    }

    /**
     * Deletes the question.
     * @throws Error if question couldn't be deleted.
     */
    delete() {
        // TODO
        if (null) {
            throw new Error("...");
        }
    }
}
