import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";

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
                // --- THIS IS THE FINAL FIX ---
                isLiked: {
                    $cond: {
                        // First, check if there IS a loggedInUserId
                        if: loggedInUserId, 
                        // If yes, then check if it's in the likes array
                        then: { $in: [loggedInUserId, "$likes.likedBy"] },
                        // If no, isLiked is automatically false
                        else: false
                    }
                }
            }
        },
        { $project: { likes: 0, replies: 0 } },
        { $sort: { createdAt: -1 } } 
    ];
    return pipeline;
};
// Get all public tweets
const getAllTweets = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const pipeline = getTweetsAggregatePipeline({ parentTweet: { $exists: false } }, req.user?._id);
    const tweetsAggregate = Tweet.aggregate(pipeline);
    const result = await Tweet.aggregatePaginate(tweetsAggregate, { page, limit });
    return res.status(200).json(new ApiResponse(200, result, "Tweets fetched successfully"));
});

// Get personalized feed for a logged-in user
const getFeedTweets = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const subscriptions = await Subscription.find({ subscriber: req.user._id });
    const subscribedChannelIds = subscriptions.map(sub => sub.channel);
    
    // --- FINAL FIX IS HERE ---
    // Safely create a unique list of ObjectIDs to query
    const channelIdsToFetch = [...new Set([req.user._id, ...subscribedChannelIds].map(id => id.toString()))].map(id => new mongoose.Types.ObjectId(id));

    const pipeline = getTweetsAggregatePipeline({ owner: { $in: channelIdsToFetch }, parentTweet: { $exists: false } }, req.user._id);
    const tweetsAggregate = Tweet.aggregate(pipeline);
    const result = await Tweet.aggregatePaginate(tweetsAggregate, { page, limit });
    return res.status(200).json(new ApiResponse(200, result, "User feed fetched successfully"));
});

// Create a new tweet or reply
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

    const tweet = await Tweet.create({ content, owner: req.user._id, parentTweet: parentTweetId || null });
    if (!tweet) throw new ApiError(500, "Failed to create tweet in the database.");
    
    // --- FINAL FIX IS HERE ---
    // Use an aggregation to get the newly created tweet with all necessary fields
    // This ensures the data structure matches the feed, making the instant update work
    const createdTweetPipeline = getTweetsAggregatePipeline({ _id: tweet._id }, req.user._id);
    const createdTweet = await Tweet.aggregate(createdTweetPipeline);

    if (!createdTweet?.length) throw new ApiError(500, "Could not retrieve the created tweet.");

    return res.status(201).json(new ApiResponse(201, createdTweet[0], "Tweet created successfully"));
});

// Get a single tweet by its ID
const getTweetById = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid Tweet ID");
    
    const pipeline = getTweetsAggregatePipeline({ _id: new mongoose.Types.ObjectId(tweetId) }, req.user?._id);
    const tweet = await Tweet.aggregate(pipeline);
    
    if (!tweet?.length) throw new ApiError(404, "Tweet not found");
    return res.status(200).json(new ApiResponse(200, tweet[0], "Tweet fetched successfully"));
});

// Get all replies for a tweet
const getTweetReplies = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid Tweet ID");
    const pipeline = getTweetsAggregatePipeline({ parentTweet: new mongoose.Types.ObjectId(tweetId) }, req.user?._id);
    const replies = await Tweet.aggregate(pipeline);
    return res.status(200).json(new ApiResponse(200, replies, "Replies fetched successfully"));
});

// Update a tweet
const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;
    if (!content?.trim()) throw new ApiError(400, "Content is required");
    if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid tweet ID");

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) throw new ApiError(404, "Tweet not found");
    if (tweet.owner.toString() !== req.user._id.toString()) throw new ApiError(403, "You are not authorized to edit this tweet");
    
    const tweetAgeInMinutes = (Date.now() - new Date(tweet.createdAt).getTime()) / 1000 / 60;
    if (tweetAgeInMinutes > 15) throw new ApiError(403, "Tweets can only be edited within 15 minutes.");

    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId, { $set: { content } }, { new: true });
    if (!updatedTweet) throw new ApiError(500, "Failed to update tweet.");
    
    return res.status(200).json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
});

// Delete a tweet
const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid tweet ID");

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) throw new ApiError(404, "Tweet not found");
    if (tweet.owner.toString() !== req.user._id.toString()) throw new ApiError(403, "You can only delete your own tweets");

    const deletionResult = await Tweet.findByIdAndDelete(tweetId);
    if (!deletionResult) throw new ApiError(500, "Failed to delete tweet.");

    // Consider also deleting likes and replies associated with this tweet
    
    return res.status(200).json(new ApiResponse(200, { _id: tweetId }, "Tweet deleted successfully"));
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