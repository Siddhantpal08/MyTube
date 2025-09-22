// src/routes/like.routes.js
import { Router } from 'express';
import {
    getLikedVideos,
    toggleCommentLike,
    toggleVideoLike,
    toggleTweetLike,
    getVideoLikeStatus // <-- Import the new function
} from "../controllers/like.controller.js"
// Import BOTH auth middlewares
import { verifyJWT, verifyJWTAndSetUser } from "../middlewares/auth.middleware.js"

const router = Router();

// --- Public Route (with optional auth) ---
// This allows anyone to see the like count, but also gets the logged-in user's like status.
router.route("/video/:videoId").get(verifyJWTAndSetUser, getVideoLikeStatus);


// --- All routes below this require a strict login ---
router.use(verifyJWT);

router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/toggle/t/:tweetId").post(toggleTweetLike);
router.route("/videos").get(getLikedVideos);

export default router;