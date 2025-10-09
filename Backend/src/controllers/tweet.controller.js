import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";

const getTweetsAggregate = (matchStage = {}, userId = null) => {
    return [
        matchStage, // This will be the filter (e.g., all tweets, or tweets from subscribed channels)
        {
            $lookup: { // Join with likes
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likes"
            }
        },
        {
            $lookup: { // Join with users to get the owner's details
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [{ $project: { username: 1, fullName: 1, avatar: 1 } }]
            }
        },
        {
            $addFields: {
                likesCount: { $size: "$likes" },
                owner: { $first: "$owner" },
                // Check if the current logged-in user's ID is in the 'likes' array
                isLiked: userId ? { $in: [new mongoose.Types.ObjectId(userId), "$likes.likedBy"] } : false
            }
        },
        { $project: { likes: 0 } }, // Remove the full likes array to save bandwidth
        { $sort: { createdAt: -1 } }
    ];
};

// --- CONTROLLERS ---

const getAllTweets = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    // Use the aggregation pipeline for the public feed
    const tweetsAggregate = Tweet.aggregate(getTweetsAggregate({}, req.user?._id));
    const result = await Tweet.aggregatePaginate(tweetsAggregate, { page, limit });
    return res.status(200).json(new ApiResponse(200, result, "All tweets fetched successfully"));
});

const getSubscribedTweets = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const subscriptions = await Subscription.find({ subscriber: req.user._id });
    const channelIds = subscriptions.map(sub => sub.channel);
    
    // Use the aggregation pipeline with a filter for subscribed channels
    const tweetsAggregate = Tweet.aggregate(getTweetsAggregate({ $match: { owner: { $in: channelIds } } }, req.user._id));
    const result = await Tweet.aggregatePaginate(tweetsAggregate, { page, limit });
    return res.status(200).json(new ApiResponse(200, result, "Subscribed feed fetched successfully"));
});

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    if (!content?.trim()) throw new ApiError(400, "Content is required");
    const tweet = await Tweet.create({ content, owner: req.user._id });
    const createdTweet = await Tweet.findById(tweet._id).populate("owner", "username fullName avatar");
    return res.status(201).json(new ApiResponse(201, createdTweet, "Tweet created successfully"));
});

const getTweetById = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid Tweet ID");

    // Use the aggregation pipeline to get a single tweet with all details
    const tweetAggregate = Tweet.aggregate(getTweetsAggregate({ $match: { _id: new mongoose.Types.ObjectId(tweetId) } }, req.user?._id));
    const tweet = await tweetAggregate.exec();
    
    if (!tweet.length) throw new ApiError(404, "Tweet not found");
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