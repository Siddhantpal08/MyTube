import { Router } from 'express';
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment,
    getInternalCommentsForYoutubeVideo,

} from "../controllers/comment.controller.js";
// Import both auth middlewares
import { verifyJWT, verifyJWTAndSetUser } from "../middlewares/auth.middleware.js";

const router = Router();

// IMPROVEMENT: Use flexible auth for viewing, strict auth for actions
router.route("/:videoId")
    .get(verifyJWTAndSetUser, getVideoComments) // Anyone can view comments
    .post(verifyJWT, addComment);            // Must be logged in to post

router.route("/yt/:youtubeVideoId")
    .get(verifyJWTAndSetUser, getInternalCommentsForYoutubeVideo);


router.route("/c/:commentId")
    .delete(verifyJWT, deleteComment)         // Must be logged in to delete
    .patch(verifyJWT, updateComment);          // Must be logged in to update

export default router;