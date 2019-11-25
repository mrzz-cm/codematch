const user = require("../user");
const config = require("../config");
const logger = require("../logger").logger;

/* eslint complexity: ["error", 20] */

const userCollection = config.collections.users;
const EARTH_RADIUS = 6371; // Earth's radius (KM)

const LOCATION_WEIGHT = 1;
const LAST_ACTIVE_WEIGHT = 10e-13;
const COURSE_CODE_WEIGHT = 1;
const USER_RATING_WEIGHT = 1;

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
        const um = user({ mongo });

        let seekerJson;
        try {
            seekerJson = await um.User.retrieve(this._question.seeker);
        } catch (e) {
            throw new Error(e);
        }

        const collection = await mongo.db.collection(userCollection);

        const checkedHelpers = this._question.prevCheckedHelpers;

        let highestQuery;
        try {
            /* Calculate highest rated user with MongoDB query */
            highestQuery = await collection.aggregate([{
                $match: {
                    userId: {
                        $ne: seekerJson.userId
                    },
                    currentQuestion: {
                        $eq: null
                    },
                    currentMatchedQuestion: {
                        $eq: null
                    }
                }
            },
            {
                $addFields: {
                    dLat: {
                        $degreesToRadians: {
                            $subtract: [
                                seekerJson.location.latitude,
                                "$location.latitude"
                            ]
                        }
                    },
                    dLong: {
                        $degreesToRadians: {
                            $subtract: [
                                seekerJson.location.longitude,
                                "$location.longitude"
                            ]
                        }
                    },
                    lat1: {
                        $degreesToRadians: 1
                    },
                    long1: {
                        $degreesToRadians: 2
                    },
                    lat2: {
                        $degreesToRadians: "$location.latitude"
                    },
                    long2: {
                        $degreesToRadians: "$location.longitude"
                    },

                    totalPoints: {
                        $multiply: [ "$points", USER_RATING_WEIGHT ]
                    },
                    totalLastOnline: {
                        $multiply: [ "$lastOnline", LAST_ACTIVE_WEIGHT ]
                    },

                    totalCourses: {
                        $cond: {
                            if: {
                                /* true when the first array is a subset of the
                                second, including when the first array equals
                                the second array, and false otherwise */
                                $setIsSubset: [
                                    [ this._question.courseCode ], "$courses"
                                ]
                            },
                            then: COURSE_CODE_WEIGHT,
                            else: 0
                        }
                    },
                },
            },
            {
                $addFields: {
                    totalRating: {
                        $cond: {
                            if: {
                                $setIsSubset: [
                                    [ "$userId" ], checkedHelpers
                                ]
                            },
                            /* Null if user already checked so $max ignores */
                            then: null,
                            else: {
                                $add: [{
                                    $add: [
                                        "$totalPoints",
                                        {
                                            $add: [{
                                                $add: [
                                                    "$totalLastOnline",
                                                    "$totalCourses"
                                                ]
                                            },
                                            {
                                                $add: [{
                                                    $multiply: [{
                                                        $sin: {
                                                            $divide: [
                                                                "$dLat", 2
                                                            ]
                                                        }
                                                    },
                                                    {
                                                        $sin: {
                                                            $divide: [
                                                                "$dLong", 2
                                                            ]
                                                        }
                                                    }
                                                    ]
                                                },
                                                {
                                                    $multiply: [
                                                        {
                                                            $multiply: [{
                                                                $cos: "$lat1"
                                                            },
                                                            {
                                                                $cos: "$lat2"
                                                            },
                                                            {
                                                                $sin: {
                                                                    $divide: [
                                                                        "$dLong", 2
                                                                    ]
                                                                }
                                                            },
                                                            {
                                                                $sin: {
                                                                    $divide: [
                                                                        "$dLong", 2
                                                                    ]
                                                                }
                                                            }
                                                            ]
                                                        },
                                                        EARTH_RADIUS * -LOCATION_WEIGHT
                                                    ]
                                                }
                                                ]
                                            }
                                            ]
                                        }
                                    ]
                                }]
                            }
                        }
                    }
                },
            },
            {
                $group: {
                    _id: null,
                    finalRating: {
                        $max: "$totalRating"
                    },
                    /* Get all the documents in the group using $push */
                    records: {
                        $push: "$$ROOT"
                    }
                }
            },
            /* Keep only that which have maximum finalRating == $totalRating */
            {
                $project: {
                    items: {
                        $filter: {
                            input: "$records",
                            as: "re",
                            cond: {
                                $eq: [
                                    "$$re.totalRating",
                                    "$$ROOT.finalRating"
                                ]
                            }
                        }
                    },
                    finalRating: "$$ROOT.finalRating"
                }
            }
            ]);
        } catch (e) {
            throw new Error(e);
        }

        let highestUsers;
        try {
            highestUsers = await highestQuery.toArray();
        } catch (e) {
            throw new Error(e);
        }

        logger.log("debug","Match weights:", {
            weights: highestUsers,
            seeker: this._question.seeker,
        });

        if ((highestUsers.length === 0) ||
            (highestUsers[0].items === null) ||
            (highestUsers[0].items.length === 0)) {
            throw new Error("no match was found for user");
        }

        let highest;
        for (const u of highestUsers[0].items) {
            highest = { userId: u.userId, rating: u.totalRating };
            if (highest.userId !== null) {
                break;
            }
        }

        logger.log("debug","Found match:", {
            highest,
            seeker: this._question.seeker,
        });

        /* The seeker’s rating will be taken into account as well, to
         * incentivize users to act as helpers. If the seeker’s rating is too far
         * below the best helper’s, the next best helper is chosen, and so on.
         * This can be represented as follows:
         */
        // if ((highest.rating - question.uuid) < scoreDifferenceThreshold) {
        //     matchSimilarScore = false;
        // }

        if (highest.userId === null) {
            throw new Error("no match was found for user");
        }

        return highest;
    }

}

module.exports = function (options) {
    mongo = options.mongo;

    const module = {};

    module.Match = Match;

    return module;
};
