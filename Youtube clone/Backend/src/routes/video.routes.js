import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
} from "../controllers/video.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"

const router = Router();

// REMOVED: router.use(verifyJWT); 
// This was making all routes private. Now we'll apply it selectively.

// --- Public Routes (No JWT required) ---
router.route("/").get(getAllVideos);
router.route("/:videoId").get(getVideoById);


// --- Protected Routes (JWT is required) ---
router.route("/").post(
    verifyJWT, // Added protection here
    upload.fields([
        { name: "videoFile", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 },
    ]),
    publishAVideo
);

router.route("/:videoId")
    .delete(verifyJWT, deleteVideo) // Added protection here
    .patch(verifyJWT, upload.single("thumbnail"), updateVideo); // Added protection here

router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus); // Added protection here

export default router;