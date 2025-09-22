// src/routes/playlist.routes.js
import { Router } from 'express';
import {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylists,
    removeVideoFromPlaylist,
    updatePlaylist,
} from "../controllers/playlist.controller.js";
import {verifyJWT} from "../middlewares/auth.middleware.js";

const router = Router();

// Apply JWT protection to all playlist routes
router.use(verifyJWT);

// Route for creating a new playlist
router.route("/").post(createPlaylist);

// --- THIS IS THE MISSING ROUTE ---
// Route for getting all playlists for a specific user
router.route("/user/:userId").get(getUserPlaylists);

// Routes for interacting with a specific playlist
router.route("/:playlistId")
    .get(getPlaylistById)
    .patch(updatePlaylist)
    .delete(deletePlaylist);

// Routes for adding/removing videos from a playlist
router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);

export default router;