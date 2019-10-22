const user = require("../user");

let mongo;

/**
 * Create a Match
 */
class Match {

    /**
     * Create a Match
     *
     * @param {Question} question
     * @param {Location} location
     */
    constructor(question, location) {
        this._question = question;
        this._location = location;


    }

    /**
     * Find the most optimal helper for a certain question based on question data
     * (such as the course of origin), the location of nearby users, how active and
     * how many points a user has, and other factors.
     *
     * @param {Question} question
     * @return {Promise<Helper>} Optimal helper
    */
    async optimalHelper(question) {
        const um = user(mongo);
        const allMatches = await um.User.getAllUsers();

        let highest = {"user": null, "rating": null};
        for (const u in allMatches) {
            if (u.userId === this._question.seeker) {
                continue;
            }
            const rating = um.User.rating(question);
            if (highest.rating === null || highest.rating < rating) {
                highest.user = u;
                highest.rating = rating;
            }
        }

        // TODO: ??
        /* The seeker’s rating will be taken into account as well, to
         * incentivize users to act as helpers. If the seeker’s rating is too far
         * below the best helper’s, the next best helper is chosen, and so on.
         * This can be represented as follows:
         */
        // if ((highest.rating - question.uuid) < scoreDifferenceThreshold) {
        //     matchSimilarScore = false;
        // }

        return highest.user;

    }

}

module.exports = function (options) {
    mongo = options.mongo;

    const module = {};

    module.Matching = Matching;

    return module;
};
