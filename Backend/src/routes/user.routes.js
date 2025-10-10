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
    resetPassword,
    updateUserAbout,
    deleteUserAccount,
    removeVideoFromHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT, verifyJWTAndSetUser } from "../middlewares/auth.middleware.js";

const router = Router();

// --- PUBLIC ROUTES ---
router.route("/register").post(
    upload.fields([{ name: "avatar", maxCount: 1 }, { name: "coverImage", maxCount: 1 }]),
    registerUser
);
router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password/:token").post(resetPassword);
router.route("/search-channels").get(searchChannels);
router.route("/c/:username").get(verifyJWTAndSetUser, getUserChannelProfile);

// --- PROTECTED ROUTES ---
router.use(verifyJWT);

// In user.routes.js, inside the "PROTECTED ROUTES" section

// The 'delete' method on the root path will trigger the account deletion
router.route("/").delete(deleteUserAccount);
router.route("/logout").post(logoutUser);
router.route("/change-password").post(changeCurrentPassword);
router.route("/current-user").get(getCurrentUser);
router.route("/update-account").patch(updateAccountDetails);
router.route("/about").patch(updateUserAbout); // Add the new route
router.route("/avatar").patch(upload.single("avatar"), updateUserAvatar);
router.route("/cover-image").patch(upload.single("coverImage"), updateUserCoverImage);
router.route("/history").get(getWatchHistory);
router.route("/history/:videoId").delete(removeVideoFromHistory);

export default router;