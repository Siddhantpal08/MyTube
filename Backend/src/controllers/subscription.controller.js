import mongoose from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const channel = await User.findById(channelId)
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    const existingSubscription = await Subscription.findOne({
        channel: channelId,
        subscriber: req.user._id
    });

    if (existingSubscription) {
        await existingSubscription.deleteOne();
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Subscription removed"));
    }

    const newSubscription = await Subscription.create({
        channel: channelId,
        subscriber: req.user._id
    });

    return res
        .status(201)
        .json(new ApiResponse(201, newSubscription, "Channel subscribed successfully"));
})


const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }

    const subscribers = await Subscription.find({ channel: channelId })
        .populate("subscriber", "username fullName avatar")

    return res
        .status(200)
        .json(new ApiResponse(200, subscribers, "Fetched subscribers successfully"))
})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID")
    }

    const subscriptions = await Subscription.find({ subscriber: subscriberId })
        .populate("channel", "username fullName avatar -_id") // exclude _id if you want

    const channelList = subscriptions.map(sub => sub.channel);

    return res
        .status(200)
        .json(new ApiResponse(200, channelList, "Fetched subscriptions successfully"))
})
const getSubscriptionStatus = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const userId = req.user?._id;

    if (!channelId) {
        throw new ApiError(400, "Channel ID is required");
    }

    const subscribersCount = await Subscription.countDocuments({ channel: channelId });

    // If the user isn't logged in, they can't be subscribed
    if (!userId) {
        return res.status(200).json(new ApiResponse(200, { isSubscribed: false, subscribersCount }, "Subscription status fetched"));
    }

    const subscription = await Subscription.findOne({
        subscriber: userId,
        channel: channelId,
    });

    const isSubscribed = !!subscription; // Convert to boolean (true if found, false if not)

    return res.status(200).json(new ApiResponse(200, { isSubscribed, subscribersCount }, "Subscription status fetched successfully"));
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
    getSubscriptionStatus
}
