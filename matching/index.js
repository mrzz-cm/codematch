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
     */
    constructor(question) {
        this._question = question;
    }

    /**
     * Find the most optimal helper for a certain question based on question data
     * (such as the course of origin), the location of nearby users, how active and
     * how many points a user has, and other factors.
     *
     * @return {Promise<Helper>} Optimal helper
    */
    async optimalHelper() {
        const um = user({ mongo: mongo });
        const allMatches = await um.User.getAllUsers(); //TODO: Error?

        let highest = {"user": null, "rating": null};
        um.User.retrieve(this._question.seeker, (err, questionUser) => {
            for (const u in allMatches) {
                if ((u.userId === this._question.seeker) ||
                    (u.currentQuestion === null)) {
                    continue;
                }
                const rating = u.rating(this._question, questionUser);
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
        });
    }

}

module.exports = function (options) {
    mongo = options.mongo;

    const module = {};

    module.Match = Match;

    return module;
};
