const user = require("../user");
const logger = require("../logger").logger;

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
     * Find the most optimal helper for a certain question based on question
     * data
     * (such as the course of origin), the location of nearby users, how active
     * and how many points a user has, and other factors.
     *
     * @return {Promise<any>} Optimal helper
    */
    async optimalHelper() {
        const um = user({ mongo: mongo });
        let allMatches;
        try {
            allMatches = await um.User.getAllUsers();
        } catch (e) {
            throw new Error(e);
        }

        let highest = {"user": null, "rating": null};

        let seekerJson;
        try {
            seekerJson = await um.User.retrieve(this._question.seeker);
        } catch (e) {
            throw new Error(e);
        }

        for (let i = 0; i < allMatches.length; i++) {
            const u = allMatches[i];
            logger.log("debug","Checking match:", {
                userId: u.userId,
                currentQuestion: u.currentQuestion,
                seeker: this._question.seeker,
            });

            if ((u.userId === this._question.seeker) ||
                (u.currentQuestion != null)) {
                continue;
            }
            const rating = u.rating(this._question, um.User.fromJson(seekerJson));
            logger.log("debug","Rating:", {
                userId: u.userId,
                rating: rating,
            });
            if (highest.rating === null || highest.rating < rating) {
                highest.user = u;
                highest.rating = rating;
            }
        }

        /* The seeker’s rating will be taken into account as well, to
         * incentivize users to act as helpers. If the seeker’s rating is too far
         * below the best helper’s, the next best helper is chosen, and so on.
         * This can be represented as follows:
         */
        // if ((highest.rating - question.uuid) < scoreDifferenceThreshold) {
        //     matchSimilarScore = false;
        // }

        if (highest.user === null) {
            throw new Error("no match was found for user");
        }

        return highest.user;
    }

}

module.exports = function (options) {
    mongo = options.mongo;

    const module = {};

    module.Match = Match;

    return module;
};
