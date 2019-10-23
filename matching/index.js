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
    async optimalHelper(callback) {
        const um = user({ mongo: mongo });
        const allMatches = await um.User.getAllUsers(); //TODO: Error?
        console.log("All matches: ", allMatches); // TODO: Remove

        let highest = {"user": null, "rating": null};
        um.User.retrieve(this._question.seeker, (err, questionUser) => {
            for (let i = 0; i < allMatches.length; i++) {
                const u = allMatches[i];
                console.log("checking user:", u.userId);
                if ((u.userId === this._question.seeker) ||
                    (u.currentQuestion == null)) {
                    continue;
                }
                const rating = u.rating(this._question, um.User.fromJson(questionUser));
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

            if (highest.user === null) {
                console.log("no match was found for user, returning ", highest.user);
                callback("No match", highest.user);
            }

            console.log("match found for user, returning ", highest.user.userId);
            callback(err, highest.user);
        });
    }

}

module.exports = function (options) {
    mongo = options.mongo;

    const module = {};

    module.Match = Match;

    return module;
};
