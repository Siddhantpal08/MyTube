import { Router } from 'express';
import {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// This single, smart route gets all comments for any video (internal or external).
// It is public, so anyone can view comments.
router.route("/:videoId").get(getVideoComments);

// All routes below this line require a user to be logged in.
router.use(verifyJWT);

// --- Protected Routes ---
router.route("/:videoId").post(addComment); // Add a comment to a video
router.route("/c/:commentId").patch(updateComment).delete(deleteComment); // Update or delete a specific comment

export default router;