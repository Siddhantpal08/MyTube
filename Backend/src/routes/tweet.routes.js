import { Router } from 'express';
import {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet,
    getAllTweets,
    getSubscribedTweets,
} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// This route is now PUBLIC. It fetches all tweets for the community page.
router.route("/").get(getAllTweets);

// This middleware protects all routes defined BELOW it.
// Any route defined above it remains public.
router.use(verifyJWT);

// --- PROTECTED ROUTES ---
router.route("/").post(createTweet);
router.route("/feed").get(getSubscribedTweets);
router.route("/user/:userId").get(getUserTweets);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router;