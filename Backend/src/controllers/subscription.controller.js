import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Controller to toggle a subscription on or off for the logged-in user
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const subscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId,
    });

    if (subscription) {
        await Subscription.findByIdAndDelete(subscription._id);
    } else {
        await Subscription.create({
            subscriber: req.user._id,
            channel: channelId,
        });
    }

    // Return the new subscription state and count for instant UI updates
    const subscribersCount = await Subscription.countDocuments({ channel: channelId });
    const isSubscribed = !subscription;

    return res.status(200).json(
        new ApiResponse(200, { isSubscribed, subscribersCount }, "Subscription toggled successfully")
    );
});

// Controller to get the list of channels a specific user is subscribed to
const getUserSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID");
    }
    // Find subscriptions and populate the 'channel' field with user details
    const subscriptions = await Subscription.find({ subscriber: subscriberId }).populate("channel", "username fullName avatar");
    return res.status(200).json(new ApiResponse(200, subscriptions, "Subscribed channels fetched successfully"));
});

// Controller to get the latest videos from all channels the logged-in user is subscribed to
const getSubscribedVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 12 } = req.query;
    const userId = req.user._id;

    // 1. Find all channels the user is subscribed to
    const subscriptions = await Subscription.find({ subscriber: userId });
    const channelIds = subscriptions.map(sub => sub.channel);

    if (channelIds.length === 0) {
        return res.status(200).json(new ApiResponse(200, { docs: [], totalDocs: 0 }, "User is not subscribed to any channels"));
    }

    // 2. Find all videos where the owner's ID is in the list of subscribed channel IDs
    const videoAggregate = Video.aggregate([
        {
            $match: {
                owner: { $in: channelIds }
            }
        },
        { $sort: { createdAt: -1 } },
        {
            $lookup: { // Join with the users collection to get owner details
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    { $project: { username: 1, avatar: 1, fullName: 1 } }
                ]
            }
        },
        {
            $addFields: {
                owner: { $first: "$owner" } // Unwind the owner array
            }
        }
    ]);
    
    const options = { page: parseInt(page, 10), limit: parseInt(limit, 10) };
    const videos = await Video.aggregatePaginate(videoAggregate, options);
    
    return res.status(200).json(new ApiResponse(200, videos, "Subscribed videos fetched successfully"));
});

// Controller to get the subscription status and count for a single channel
const getSubscriptionStatus = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const userId = req.user?._id; // Safely get the user ID for guests

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid Channel ID");
    }

    const subscribersCount = await Subscription.countDocuments({ channel: channelId });

    // If the user isn't logged in, they can't be subscribed
    if (!userId) {
        return res.status(200).json(new ApiResponse(200, { isSubscribed: false, subscribersCount }, "Subscription status fetched for guest"));
    }

    const subscription = await Subscription.findOne({
        subscriber: userId,
        channel: channelId,
    });

    const isSubscribed = !!subscription; // Convert to boolean

    return res.status(200).json(new ApiResponse(200, { isSubscribed, subscribersCount }, "Subscription status fetched successfully"));
});


export {
    toggleSubscription,
    getUserSubscribedChannels,
    getSubscribedVideos,
    getSubscriptionStatus
};