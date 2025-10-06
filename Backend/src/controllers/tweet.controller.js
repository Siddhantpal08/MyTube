import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Subscription } from "../models/subscription.model.js";

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
  
    if (!content || content.trim() === "") {
      throw new ApiError(400, "Tweet content is required");
    }
  
    let tweet = await Tweet.create({
      content,
      owner: req.user._id, // user comes from JWT middleware
    });
  
    // populate after creation
    tweet = await tweet.populate("owner", "username email avatar");
  
    return res
      .status(201)
      .json(new ApiResponse(201, tweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;
  
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid user ID");
    }
  
    const tweets = await Tweet.find({ owner: userId })
      .populate("owner", "username email avatar") // only bring selected fields
      .sort({ createdAt: -1 });
  
    return res
      .status(200)
      .json(new ApiResponse(200, tweets, "Fetched user tweets successfully"));
  });
  
  const getSubscribedTweets = asyncHandler(async (req, res) => {
    // 1. Get the user's ID from the authenticated request
    const userId = req.user._id;

    // 2. Find all the channels the user is subscribed to
    const subscriptions = await Subscription.find({ subscriber: userId }).select("channel");
    const channelIds = subscriptions.map(sub => sub.channel);

    // 3. Find all tweets where the owner is one of the subscribed channels
    const tweets = await Tweet.find({ owner: { $in: channelIds } })
        .populate("owner", "username fullName avatar")
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, { docs: tweets }, "Subscribed feed fetched successfully"));
});


const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;
  
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
  
    tweet.content = content || tweet.content;
    await tweet.save();
  
    return res
      .status(200)
      .json(new ApiResponse(200, tweet, "Tweet updated successfully"));
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

    await tweet.deleteOne();

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted successfully"));
});

const getAllTweets = asyncHandler(async (req, res) => {
  // This query finds all tweets from all users
  const tweets = await Tweet.find({})
      .populate("owner", "username avatar")
      .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, tweets, "All tweets fetched successfully"));
});


export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet,
    getAllTweets,
    getSubscribedTweets,
    
}
