const uuidv1 = require("uuid/v1");

const questionCollection = "questions";

let mongo;

/**
 * Class representing a Question
 */
class Question {
    /**
     * questionState: 'Unmatched', 'Waiting', 'Matched', 'Resolved'
     */

    /**
     * @param {string}      uuid
     * @param {string}      title
     * @param {string}      courseCode  
     * @param {string}      questionText 
     * @param {string}      seeker
     * @param {number}      creationTimestamp
     * @param {string}      optimalHelper
     * @param {number}      helperNotifiedTimestamp
     * @param {boolean}     helperAccepted
     * @param {string[]}    prevCheckedHelpers
     * @param {string}      finalHelper
     * @param {string}      questionState
     * @param {number}      finalScore
     * @param {string[]}    images
     */
    constructor(uuid, title, courseCode, questionText,
        seeker, creationTimestamp,
        optimalHelper, helperNotifiedTimestamp, helperAccepted,
        prevCheckedHelpers, finalHelper,
        questionState, finalScore, images) {
        
        this.uuid = uuid;
        this.title = title;
        this.courseCode = courseCode;
        this.questionText = questionText;
        this.seeker = seeker;
        this.creationTimestamp = creationTimestamp;
        this.optimalHelper = optimalHelper;
        this.helperNotifiedTimestamp = helperNotifiedTimestamp;
        this.helperAccepted = helperAccepted;
        this.prevCheckedHelpers = prevCheckedHelpers;
        this.finalHelper = finalHelper;
        this.questionState = questionState;
        this.finalScore = finalScore;
        this.images = images;
    }

    /**
     * Create a new Question with no previous history.
     * 
     * @param {string} user 
     * @param {string} title 
     * @param {string} courseCode 
     * @param {string} questionText
     * @param {string[]} images
     */
    static newQuestion(user, title, courseCode, questionText, images) {
        return new Question(uuidv1(), title, courseCode, questionText, user,
            Date.now(), null, null, null, [], null, "Unmatched", null, images);
    }

    /**
     * Creates a new Question from a JSON object from the database
     * @param {object} jsonObj 
     */
    static fromJson(jsonObj) {
        return new Question(
            jsonObj.uuid, jsonObj.title, jsonObj.courseCode, jsonObj.questionText,
            jsonObj.seeker, jsonObj.creationTimestamp,
            jsonObj.optimalHelper, jsonObj.helperNotifiedTimestamp,
            jsonObj.helperAccepted, jsonObj.prevCheckedHelpers,
            jsonObj.finalHelper, jsonObj.questionState,
            jsonObj.finalScore, jsonObj.images
        );
    }

    /**
     * Serializes the object into JSON so it can be stored into MongoDB
     * @returns {Object} the JSON blob representing the question
     */
    toJson() {
        return {
            uuid: this.uuid,
            title: this.title,
            courseCode: this.courseCode,
            questionText: this.questionText,
            seeker: this.seeker,
            creationTimestamp: this.creationTimestamp,
            optimalHelper: this.optimalHelper,
            helperNotifiedTimestamp: this.helperNotifiedTimestamp,
            helperAccepted: this.helperAccepted,
            prevCheckedHelpers: this.prevCheckedHelpers,
            finalHelper: this.finalHelper,
            questionState: this.questionState,
            finalScore: this.finalScore,
            images: this.images
        };
    }

    /**
     * Check if question exists
     *
     * @param uuid
     * @returns {Promise<boolean>}
     */
    static async exists(uuid) {
        try {
            const count = await mongo.db.collection(questionCollection)
                .find({"uuid": {$exists: true, $eq: uuid}})
                .count();
            return count !== 0;
        } catch (err) {
            throw new Error(
                `Failed to check for ${uuid} in database`
            );
        }
    }

    /**
     * Adds a question to our database.
     * @return Promise<any>
     */
    async create() {
        const collection = await mongo.db.collection(questionCollection);
        const jsonData = this.toJson();
        try {
            await collection.createIndexes(
                [ { key: {uuid: 1 } } ],
                { unique: true }
            );
            return collection.insertOne(jsonData);
        } catch (err) {
            throw new Error(
                `Failed to insert ${jsonData.uuid} into the collection`
            );
        }
    }

    /**
     * Updates the question in the database
     *
     * @param {object} update
     * @return {Promise<any>}
     */
    async update(update) {
        const collection = await mongo.db.collection(questionCollection);
        try {
            return collection.findOneAndUpdate({uuid: this.uuid}, update);
        } catch (err) {
            throw new Error(
                `Failed to update question ${this.uuid}`
            );
        }
    }

    /**
     * Retrieve a question from database.
     * @param {string}   uuid
     * @return {Promise<Object>}
     */
    static async retrieve(uuid) {
        const collection = await mongo.db.collection(questionCollection);
        try {
            return collection.findOne({ uuid });
        } catch (err) {
            throw new Error(
                `Failed to retrieve question ${uuid}`
            );
        }
    }
}


/**
 * Module Functions
 */

module.exports = function (options) {
    mongo = options.mongo;

    const module = {};

    module.Question = Question;

    return module;
};
