import { Router } from 'express';
import { searchVideos, getVideoDetails } from "../controllers/youtube.controller.js";

const router = Router();

// This is a public route, so no verifyJWT is needed
router.route("/search").get(searchVideos);
router.route("/video/:videoId").get(getVideoDetails);

export default router;