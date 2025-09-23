// src/routes/subscription.routes.js
import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
    getSubscriptionStatus
} from "../controllers/subscription.controller.js";
import { verifyJWT, verifyJWTAndSetUser } from "../middlewares/auth.middleware.js";

const router = Router();

// This combined route handles both GET and POST requests for a specific channel
router.route("/c/:channelId")
    .get(verifyJWTAndSetUser, getSubscriptionStatus) // Public viewing
    .post(verifyJWT, toggleSubscription);            // Protected action

// All routes below this point are actions that require a strict login
router.use(verifyJWT);

router.route("/c/:channelId/subscribers").get(getUserChannelSubscribers);
router.route("/u/:subscriberId").get(getSubscribedChannels);

export default router;