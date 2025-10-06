import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";

// --- PUBLIC FEED (FOR GUESTS) ---
const getAllTweets = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    const tweetsAggregate = Tweet.aggregate([
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: { $first: "$ownerDetails" }
            }
        },
        {
            $project: {
                ownerDetails: 0
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ]);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    const result = await Tweet.aggregatePaginate(tweetsAggregate, options);

    if (!result) {
        throw new ApiError(500, "Could not retrieve tweets");
    }

    return res.status(200).json(new ApiResponse(200, result, "All tweets fetched successfully"));
});

// --- PERSONALIZED FEED (FOR LOGGED-IN USERS) ---
const getSubscribedTweets = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user._id;

    const subscriptions = await Subscription.find({ subscriber: userId });
    const channelIds = subscriptions.map(sub => sub.channel);

    const tweetsAggregate = Tweet.aggregate([
        {
            $match: {
                owner: { $in: channelIds }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: { username: 1, fullName: 1, avatar: 1 }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: { $first: "$ownerDetails" }
            }
        },
        {
            $project: {
                ownerDetails: 0
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ]);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };
    
    const result = await Tweet.aggregatePaginate(tweetsAggregate, options);

    return res.status(200).json(new ApiResponse(200, result, "Subscribed feed fetched successfully"));
});

// --- OTHER TWEET CONTROLLERS ---

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

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;
 
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }
 
    const tweets = await Tweet.find({ owner: userId })
        .populate("owner", "username fullName avatar")
        .sort({ createdAt: -1 });
 
    return res.status(200).json(new ApiResponse(200, { docs: tweets }, "Fetched user tweets successfully"));
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
    getUserTweets,
    updateTweet,
    deleteTweet,
    getAllTweets,
    getSubscribedTweets,
};