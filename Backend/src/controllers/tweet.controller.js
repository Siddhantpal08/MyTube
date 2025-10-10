import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";

/**
 * Reusable aggregation pipeline to fetch, populate, and format tweets.
 * Ensures fields like likesCount, owner details, and isLiked status are included.
 * @param {object} matchCondition - MongoDB $match object (e.g., { parentTweet: null })
 * @param {string | null} userId - ID of the currently logged-in user (optional)
 * @returns {Array} MongoDB aggregation pipeline stages
 */
const getTweetsAggregatePipeline = (matchCondition = {}, userId = null) => {
    const loggedInUserId = userId ? new mongoose.Types.ObjectId(userId) : null;
    const pipeline = [
        { $match: matchCondition },
        { $lookup: { from: "likes", localField: "_id", foreignField: "tweet", as: "likes" } },
        { $lookup: { from: "users", localField: "owner", foreignField: "_id", as: "owner", pipeline: [{ $project: { username: 1, fullName: 1, avatar: 1 } }] } },
        { $lookup: { from: "tweets", localField: "_id", foreignField: "parentTweet", as: "replies" } },
        {
            $addFields: {
                likesCount: { $size: "$likes" },
                replyCount: { $size: "$replies" },
                owner: { $first: "$owner" },
                isLiked: {
                    $cond: {
                        if: { $eq: [loggedInUserId, null] },
                        then: false,
                        else: { $in: [loggedInUserId, "$likes.likedBy"] }
                    }
                }
            }
        },
        { $project: { likes: 0, replies: 0 } },
        { $sort: { createdAt: -1 } } //  <-- THE FIX IS HERE
    ];
    return pipeline;
};

const getAllTweets = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const pipeline = getTweetsAggregatePipeline({ parentTweet: { $exists: false } }, req.user?._id);
    const tweetsAggregate = Tweet.aggregate(pipeline);
    const result = await Tweet.aggregatePaginate(tweetsAggregate, { page, limit });
    return res.status(200).json(new ApiResponse(200, result, "All tweets fetched successfully"));
});

// In src/controllers/tweet.controller.js

const getFeedTweets = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    
    const subscriptions = await Subscription.find({ subscriber: req.user._id });
    const subscribedChannelIds = subscriptions.map(sub => sub.channel);
    
    const channelIdsWithDuplicates = [...subscribedChannelIds, req.user._id];
    const channelIdsToFetch = [...new Set(channelIdsWithDuplicates)];

    const pipeline = getTweetsAggregatePipeline(
        { 
            owner: { $in: channelIdsToFetch },
            parentTweet: { $exists: false }
        }, 
        req.user._id
    );

    const tweetsAggregate = Tweet.aggregate(pipeline);
    const result = await Tweet.aggregatePaginate(tweetsAggregate, { page, limit });

    // --- TEMPORARY TEST LINE ---
    return res.status(200).json(new ApiResponse(200, result, "DEPLOYMENT TEST SUCCESSFUL - VERSION 3"));
});

const createTweet = asyncHandler(async (req, res) => {
    const { content, parentTweetId } = req.body;
    if (!content?.trim()) throw new ApiError(400, "Content is required");

    if (parentTweetId) {
        if (!isValidObjectId(parentTweetId)) throw new ApiError(400, "Invalid parent tweet ID");
        const parentTweet = await Tweet.findById(parentTweetId);
        if (!parentTweet) throw new ApiError(404, "Parent tweet not found");
        if (parentTweet.owner.toString() === req.user._id.toString()) {
            throw new ApiError(403, "You cannot reply to your own post.");
        }
    }

    const tweet = await Tweet.create({ 
        content, 
        owner: req.user._id,
        parentTweet: parentTweetId || null
    });
    
    // We need to get the full owner object for the optimistic update
    const populatedTweet = await Tweet.findById(tweet._id).populate("owner", "username fullName avatar").lean();

    // --- SECOND FIX IS HERE ---
    // Manually add the missing fields that the aggregation pipeline would normally add
    const createdTweet = {
        ...populatedTweet,
        likesCount: 0,
        replyCount: 0,
        isLiked: false,
    };
    
    return res.status(201).json(new ApiResponse(201, createdTweet, "Tweet created successfully"));
});

const getTweetById = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid Tweet ID");

    const pipeline = getTweetsAggregatePipeline({ _id: new mongoose.Types.ObjectId(tweetId) }, req.user?._id);
    
    const tweet = await Tweet.aggregate(pipeline);
    
    if (!tweet?.length) {
        throw new ApiError(404, "Tweet not found");
    }
    return res.status(200).json(new ApiResponse(200, tweet[0], "Tweet fetched successfully"));
});


const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
        throw new ApiError(400, "Content is required");
    }
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to edit this tweet");
    }

    const tweetAgeInMinutes = (Date.now() - new Date(tweet.createdAt).getTime()) / 1000 / 60;
    if (tweetAgeInMinutes > 15) {
        throw new ApiError(403, "Tweets can only be edited within 15 minutes of posting.");
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        { $set: { content } },
        { new : true }
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
        throw new ApiError(403, "You can only delete your own tweets");
    }

    await Tweet.findByIdAndDelete(tweetId);

    return res.status(200).json(new ApiResponse(200, { _id: tweetId }, "Tweet deleted successfully"));
});

const getTweetReplies = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Tweet ID");
    }

    const pipeline = getTweetsAggregatePipeline(
        { parentTweet: new mongoose.Types.ObjectId(tweetId) },
        req.user?._id
    );

    const replies = await Tweet.aggregate(pipeline);

    return res.status(200).json(new ApiResponse(200, replies, "Replies fetched successfully"));
});

export {
    createTweet,
    updateTweet,
    deleteTweet,
    getAllTweets,
    getTweetById,
    getFeedTweets,
    getTweetReplies,
};
