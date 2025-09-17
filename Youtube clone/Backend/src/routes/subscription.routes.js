import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
    getSubscriptionStatus
} from "../controllers/subscription.controller.js";
// Import BOTH middleware functions from your updated auth.middleware.js
import { verifyJWT, verifyJWTAndSetUser } from "../middlewares/auth.middleware.js";

const router = Router();

// --- Public Route with Optional Auth ---
// Anyone can see the subscriber count, but logged-in users will also see if they are subscribed.
router.route("/c/:channelId")
    .get(verifyJWTAndSetUser, getSubscriptionStatus);

// --- All Routes Below This Point Require a Strict Login ---
router.use(verifyJWT);

// Routes for actions that a user MUST be logged in to perform
router.route("/c/:channelId").post(toggleSubscription);
router.route("/c/:channelId/subscribers").get(getUserChannelSubscribers);
router.route("/u/:subscriberId").get(getSubscribedChannels);

export default router;