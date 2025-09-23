// src/routes/user.routes.js
import { Router } from 'express';
import { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAcessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage, 
    getUserChannelProfile, 
    getWatchHistory, 
    searchChannels,
    forgotPassword, // New
    resetPassword,  // New
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"; // Make sure verifyJWT is imported

const router = Router();

// Public routes
router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 },
    ]),
    registerUser
);

router.use(verifyJWT);

router.route("/register").post( /* ... */ );
router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAcessToken);
router.route("/search-channels").get(searchChannels);
router.route("/forgot-password").post(forgotPassword); // New route
router.route("/reset-password/:token").post(resetPassword); // New route



// Make Channel Profile Public (moved here)
router.route("/c/:username").get(getUserChannelProfile); // Now public

// Authenticated routes (user must be logged in for all below this line)
router.use(verifyJWT); // Apply verifyJWT middleware to all routes below this line

router.route("/logout").post(logoutUser);
router.route("/change-password").post(changeCurrentPassword);
router.route("/current-user").get(getCurrentUser);
router.route("/update-account").patch(updateAccountDetails);
router.route("/avatar").patch(upload.single("avatar"), updateUserAvatar);
router.route("/cover-image").patch(upload.single("coverImage"), updateUserCoverImage);
router.route("/history").get(getWatchHistory);


export default router;