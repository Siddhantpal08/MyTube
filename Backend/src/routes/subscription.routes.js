import { Router } from 'express';
import {
    getUserSubscribedChannels,
    toggleSubscription,
    getSubscribedVideos, // 1. Import the new function
    getSubscriptionStatus
} from "../controllers/subscription.controller.js";
import { verifyJWT, verifyJWTAndSetUser } from "../middlewares/auth.middleware.js";

const router = Router();

// This middleware protects all routes in this file, as they all relate to a specific user.
router.use(verifyJWT);

// --- ROUTES ---

// Route to get the list of channels the user is subscribed to
router.route("/u/:subscriberId").get(getUserSubscribedChannels);

// Route to get the subscription status for a specific channel
router.route("/c/:channelId").get(getSubscriptionStatus);

// Route to toggle a subscription on/off
router.route("/c/:channelId").post(toggleSubscription);

// 2. NEW ROUTE: This gets all the videos from the user's subscribed channels
router.route("/videos").get(getSubscribedVideos);

export default router;

