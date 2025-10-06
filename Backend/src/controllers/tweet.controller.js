import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";

const getAllTweets = asyncHandler(async (req, res) => {
    // --- PAGINATION LOGIC ---
    const { page = 1, limit = 10 } = req.query;
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        populate: { path: "owner", select: "username fullName avatar" },
        sort: { createdAt: -1 }
    };

    const tweetsAggregate = Tweet.aggregate([]); // Create an aggregate pipeline
    const result = await Tweet.aggregatePaginate(tweetsAggregate, options);

    if (!result) {
        throw new ApiError(500, "Could not retrieve tweets");
    }

    return res.status(200).json(new ApiResponse(200, result, "All tweets fetched successfully"));
});

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
 
    if (!content || content.trim() === "") {
      throw new ApiError(400, "Tweet content is required");
    }
 
    let tweet = await Tweet.create({
      content,
      owner: req.user._id,
    });
 
    // Fetch the full tweet with owner details to return to the client
    const createdTweet = await Tweet.findById(tweet._id).populate("owner", "username fullName avatar");

    if (!createdTweet) {
        throw new ApiError(500, "Something went wrong while creating the tweet");
    }
 
    return res.status(201).json(new ApiResponse(201, createdTweet, "Tweet created successfully"));
});

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

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;
 
    if (!content) {
        throw new ApiError(400, "Content field is required to update tweet");
    }
    if (!isValidObjectId(tweetId)) {
      throw new ApiError(400, "Invalid tweet ID");
    }
 
    const tweet = await Tweet.findById(tweetId);
 
    if (!tweet) {
      throw new ApiError(404, "Tweet not found");
    }
 
    if (tweet.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You are not authorized to update this tweet");
    }
 
    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        { $set: { content } },
        { new: true }
    ).populate("owner", "username fullName avatar");
 
    return res.status(200).json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
});

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
        throw new ApiError(403, "You are not authorized to delete this tweet");
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