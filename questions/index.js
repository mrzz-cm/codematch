const userModule = require("../user");
const uuidv1 = require('uuid/v1');

let mongo;

/**
 * Class representing a Question
 */
class Question {
    /**
     * questionState: 'Unmatched', 'Matched', 'Resolved'
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
     */
    constructor(uuid, title, courseCode, questionText,
            seeker, creationTimestamp,
            optimalHelper, helperNotifiedTimestamp, helperAccepted,
            prevCheckedHelpers, finalHelper,
            questionState, finalScore) {
        
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
    }

    /**
     * Create a new Question with no previous history.
     * 
     * @param {string} user 
     * @param {string} title 
     * @param {string} courseCode 
     * @param {string} questionText
     */
    static newQuestion(user, title, courseCode, questionText) {
        return new Question(uuidv1(), title, courseCode, questionText, 
            user, Date.now(), null, null, null, [], null, 'Unmatched', null);
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
            jsonObj.finalScore
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
            finalScore: this.finalScore
        }
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


/**
 * Module Functions
 */

/**
 * Handles the request to post a question.
 */
 function createQuestion(questionData, callback) {
    // make a new question
    const new_question = Question.newQuestion(questionData.userId, questionData.title,
        questionData.courseCode, questionData.questionText);
    callback(null, 200, new_question);
 }


module.exports = function (options) {
    mongo = options.mongo;

    const module = {};

    module.createQuestion = createQuestion;

    return module;
}
