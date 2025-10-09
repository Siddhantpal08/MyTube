import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";

const getTweetsAggregatePipeline = (matchCondition = {}, userId = null) => {
    const loggedInUserId = userId ? new mongoose.Types.ObjectId(userId) : null;

    // --- THIS IS THE FIX ---
    // The pipeline now correctly wraps the incoming matchCondition in a $match stage.
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
        { $sort: { createdAt: -1 } }
    ];
    return pipeline;
};

// --- CONTROLLER FUNCTIONS ---

const getAllTweets = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const pipeline = getTweetsAggregatePipeline({ parentTweet: { $exists: false } }, req.user?._id);
    const tweetsAggregate = Tweet.aggregate(pipeline);
    const result = await Tweet.aggregatePaginate(tweetsAggregate, { page, limit });
    return res.status(200).json(new ApiResponse(200, result, "All tweets fetched successfully"));
});

const getSubscribedTweets = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const subscriptions = await Subscription.find({ subscriber: req.user._id });
    const channelIds = subscriptions.map(sub => sub.channel);

    const pipeline = getTweetsAggregatePipeline(
        { 
            owner: { $in: channelIds },
            parentTweet: { $exists: false }
        }, 
        req.user._id
    );

    const tweetsAggregate = Tweet.aggregate(pipeline);
    const result = await Tweet.aggregatePaginate(tweetsAggregate, { page, limit });
    return res.status(200).json(new ApiResponse(200, result, "Subscribed feed fetched successfully"));
});

// --- UPDATED: createTweet now handles replies and the "no reply to self" rule ---
const createTweet = asyncHandler(async (req, res) => {
    const { content, parentTweetId } = req.body;
    if (!content?.trim()) throw new ApiError(400, "Content is required");

    // If it's a reply, validate the parent and check ownership
    if (parentTweetId) {
        if (!isValidObjectId(parentTweetId)) throw new ApiError(400, "Invalid parent tweet ID");
        const parentTweet = await Tweet.findById(parentTweetId);
        if (!parentTweet) throw new ApiError(404, "Parent tweet not found");
        
        // --- Rule: No replies to self ---
        if (parentTweet.owner.toString() === req.user._id.toString()) {
            throw new ApiError(403, "You cannot reply to your own post.");
        }
    }

    const tweet = await Tweet.create({ 
        content, 
        owner: req.user._id,
        parentTweet: parentTweetId || null
    });
    
    const createdTweet = await Tweet.findById(tweet._id).populate("owner", "username fullName avatar");
    return res.status(201).json(new ApiResponse(201, createdTweet, "Tweet created successfully"));
});

const getTweetById = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid Tweet ID");

    // --- THIS IS ALSO FIXED ---
    // The call to the helper now correctly passes just the match condition, not the full stage.
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

  // --- THE 15-MINUTE EDIT RULE ---
  const tweetAgeInMinutes = (Date.now() - new Date(tweet.createdAt).getTime()) / 1000 / 60;
  if (tweetAgeInMinutes > 15) {
      throw new ApiError(403, "Tweets can only be edited within 15 minutes of posting.");
  }
  // --- END FIX ---

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

export {
    createTweet,
    updateTweet,
    deleteTweet,
    getAllTweets,
    getTweetById,
    getSubscribedTweets,
};