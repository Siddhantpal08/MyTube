import { Router } from 'express';
import {
    getLikedVideos,
    toggleCommentLike,
    toggleVideoLike,
    toggleTweetLike,
    getVideoLikeStatus,
} from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All routes in this file require a user to be logged in,
// so we apply the authentication middleware at the top.
router.use(verifyJWT);

router.route("/video/:videoId").get(getVideoLikeStatus);

// Route to get all of the current user's liked videos
router.route("/videos").get(getLikedVideos);

// Route to toggle a like on a video
router.route("/toggle/v/:videoId").post(toggleVideoLike);

// Route to toggle a like on a comment
router.route("/toggle/c/:commentId").post(toggleCommentLike);

// Route to toggle a like on a tweet
router.route("/toggle/t/:tweetId").post(toggleTweetLike);

export default router;