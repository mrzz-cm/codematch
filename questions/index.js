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
     */
    constructor(user, title, imageId, courseCode) {
        this._user = user;
        this._title = title;
        this._imageId = imageId;
        this._courseCode = courseCode;
        this._uuid = "GENERATE GUID HERE"; // TODO
        this._helper = Helper.emptyHelper();
    }

    /**
     * Get the userId
     * @return {string} The userId.
     */
    get userId() {
        return this._user;
    }

    /**
     * Get the title
     * @return {string} The title.
     */
    get title() {
        return this._title;
    }

    /**
     * Get the courseCode
     * @return {string} The courseCode.
     */
    get courseCode() {
        return this._courseCode;
    }

    /**
     * Get the helper
     * @return {Helper} The helper.
     */
    get imageId() {
        return this._imageId;
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
