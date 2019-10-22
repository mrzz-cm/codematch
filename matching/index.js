/**
 * Create a Match
 */
class Match {

    /**
     * Create a Match
     * param {Question} question
     * param {Location} location
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
     * param {Question} question
     * param {Location} location
     * returns {Helper} Optimal helper
    */
    optimalHelper(question, location) {

    }

}

/**
 * Create a Location
 */
class Location {
    /**
     * @param {number} latitude
     * @param {number} longitude
     * @param {number} timestamp
     */
    constructor(latitude, longitude, timestamp) {

    }
}

