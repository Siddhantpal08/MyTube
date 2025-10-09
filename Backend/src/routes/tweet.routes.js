import { Router } from 'express';
import {
    createTweet,
    getTweetById,
    updateTweet,
    deleteTweet,
    getAllTweets,
    getFeedTweets, // <-- RENAMED IMPORT
    getTweetReplies 
} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// This route is now PUBLIC. It fetches all tweets for the community page.
router.route("/").get(getAllTweets);
router.route("/replies/:tweetId").get(getTweetReplies);

// This middleware protects all routes defined BELOW it.
router.use(verifyJWT);

// --- PROTECTED ROUTES ---
router.route("/").post(createTweet);
// FIX: Updated endpoint to call the new controller name
router.route("/feed").get(getFeedTweets); 
router.route("/user/:userId").get(getTweetById);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router;