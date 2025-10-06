import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";

// Controller to create a new tweet
const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
 
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Tweet content is required");
    }
 
    const tweet = await Tweet.create({
        content,
        owner: req.user._id,
    });
 
    const createdTweet = await Tweet.findById(tweet._id).populate("owner", "username fullName avatar");

    if (!createdTweet) {
        throw new ApiError(500, "Something went wrong while creating the tweet");
    }
 
    return res.status(201).json(new ApiResponse(201, createdTweet, "Tweet created successfully"));
});

// Controller to get all tweets from a specific user
const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
 
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        populate: { path: "owner", select: "username fullName avatar" },
        sort: { createdAt: -1 }
    };
    
    const tweetsAggregate = Tweet.aggregate([{ $match: { owner: new mongoose.Types.ObjectId(userId) } }]);
    const result = await Tweet.aggregatePaginate(tweetsAggregate, options);

    return res.status(200).json(new ApiResponse(200, result, "User tweets fetched successfully"));
});
 
// Controller for the public "Community" feed, gets all tweets from all users
const getAllTweets = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        populate: { path: "owner", select: "username fullName avatar" },
        sort: { createdAt: -1 }
    };

    const tweetsAggregate = Tweet.aggregate([]);
    const result = await Tweet.aggregatePaginate(tweetsAggregate, options);

    if (!result) {
        throw new ApiError(500, "Could not retrieve tweets");
    }

    return res.status(200).json(new ApiResponse(200, result, "All tweets fetched successfully"));
});

// Controller for the private "Your Feed", gets tweets from subscribed channels
const getSubscribedTweets = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user._id;

    const subscriptions = await Subscription.find({ subscriber: userId }).select("channel");
    const channelIds = subscriptions.map(sub => sub.channel);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        populate: { path: "owner", select: "username fullName avatar" },
        sort: { createdAt: -1 }
    };

    const tweetsAggregate = Tweet.aggregate([{ $match: { owner: { $in: channelIds } } }]);
    const result = await Tweet.aggregatePaginate(tweetsAggregate, options);

    return res.status(200).json(new ApiResponse(200, result, "Subscribed feed fetched successfully"));
});

// Controller to update a tweet
const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;
 
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content is required to update tweet");
    }
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }
 
    const tweet = await Tweet.findById(tweetId);
 
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }
 
    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only update your own tweets");
    }
 
    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        { $set: { content } },
        { new: true }
    ).populate("owner", "username fullName avatar");
 
    return res.status(200).json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
});

// Controller to delete a tweet
const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only delete your own tweets");
    }

    await Tweet.findByIdAndDelete(tweetId);

    return res.status(200).json(new ApiResponse(200, { _id: tweetId }, "Tweet deleted successfully"));
});


export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet,
    getAllTweets,
    getSubscribedTweets,
};