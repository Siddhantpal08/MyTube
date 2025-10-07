import { Router } from 'express';
import { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage, 
    getUserChannelProfile, 
    getWatchHistory, 
    searchChannels,
    forgotPassword,
    resetPassword
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT, verifyJWTAndSetUser } from "../middlewares/auth.middleware.js";

const router = Router();

// --- PUBLIC ROUTES ---
// These routes do not require a user to be logged in.

router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 },
    ]),
    registerUser
);

router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password/:token").post(resetPassword);
router.route("/search-channels").get(searchChannels);

// This route is public, but uses the flexible auth to see if the viewer is subscribed
router.route("/c/:username").get(verifyJWTAndSetUser, getUserChannelProfile);


// --- PROTECTED ROUTES ---
// All routes below this line will require a valid access token.
router.use(verifyJWT);

router.route("/logout").post(logoutUser);
router.route("/change-password").post(changeCurrentPassword);
router.route("/current-user").get(getCurrentUser);
router.route("/update-account").patch(updateAccountDetails);
router.route("/avatar").patch(upload.single("avatar"), updateUserAvatar);
router.route("/about").patch(updateUserAbout);
router.route("/cover-image").patch(upload.single("coverImage"), updateUserCoverImage);
router.route("/history").get(getWatchHistory);


export default router;