const user = require("../user");
const config = require("../config");
const logger = require("../logger").logger;

const userCollection = config.collections.users;
const EARTH_RADIUS = 6371; // Earth's radius (KM)

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

        let seekerJson;
        try {
            seekerJson = await um.User.retrieve(this._question.seeker);
        } catch (e) {
            throw new Error(e);
        }

        const collection = await mongo.db.collection(userCollection);

        let highest;
        try {
            /* Calculate highest rated user with MongoDB query */
            highest = await collection.aggregate([{
                $match: {
                    userId: {
                        $ne: seekerJson.userId
                    },
                    currentQuestion: {
                        $ne: null
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
                        $multiply: ["$points", 1]
                    },
                    totalLastOnline: {
                        $multiply: ["$lastOnline", 1]
                    },

                    totalCourses: {
                        $cond: {
                            if: {
                                $setIsSubset: [
                                    [], "$courses"
                                ]
                            },
                            then: 1,
                            else: 0
                        }
                    },
                },
            },
            {
                $addFields: {
                    totalRating: {
                        $add: [{
                            $add: [
                                "$totalPoints",
                                {
                                    $add: [{
                                        $add: [
                                            "$totalLastOnline", "$totalCourses"
                                        ]
                                    },
                                    {
                                        $add: [{
                                            $multiply: [{
                                                $sin: {
                                                    $divide: ["$dLat", 2]
                                                }
                                            },
                                            {
                                                $sin: {
                                                    $divide: ["$dLong", 2]
                                                }
                                            }
                                            ]
                                        },
                                        {
                                            $multiply: [{
                                                $multiply: [{
                                                    $cos: "$lat1"
                                                },
                                                {
                                                    $cos: "$lat2"
                                                },
                                                {
                                                    $sin: {
                                                        $divide: ["$dLong", 2]
                                                    }
                                                },
                                                {
                                                    $sin: {
                                                        $divide: ["$dLong", 2]
                                                    }
                                                }
                                                ]
                                            }, -EARTH_RADIUS]
                                        }
                                        ]
                                    }
                                    ]
                                }
                            ]
                        }]
                    }
                },
            },
            {
                $group: {
                    _id: null,
                    finalRating: {
                        $max: "$totalRating"
                    }
                }
            }
            ]);
        } catch (e) {
            throw new Error(e);
        }

        logger.log("debug","Found match:", {
            highest: highest,
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
