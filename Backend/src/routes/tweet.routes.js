import { Router } from 'express';
import {
    createTweet,
    getTweetById,
    updateTweet,
    deleteTweet,
    getAllTweets,
    getFeedTweets,     // Correctly named import
    getTweetReplies 
} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes
router.route("/").get(getAllTweets);
router.route("/replies/:tweetId").get(getTweetReplies);

router.use(verifyJWT); // Protect all routes below this

// Protected routes
router.route("/").post(createTweet);
router.route("/feed").get(getFeedTweets); // This now correctly matches the import
router.route("/user/:userId").get(getTweetById); // Note: This route might be what you intended for get all tweets by a user
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router;