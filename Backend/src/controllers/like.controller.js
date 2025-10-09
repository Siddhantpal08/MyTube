import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID");
    }

    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user._id,
    });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200).json(new ApiResponse(200, { isLiked: false }, "Video like removed"));
    } else {
        await Like.create({
            video: videoId,
            likedBy: req.user._id,
        });
        return res.status(201).json(new ApiResponse(201, { isLiked: true }, "Video liked successfully"));
    }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid Comment ID");
    }

    const existingLike = await Like.findOne({
        comment: commentId, // THE FIX: Changed from 'video' to 'comment'
        likedBy: req.user._id,
    });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200).json(new ApiResponse(200, { isLiked: false }, "Comment like removed"));
    } else {
        await Like.create({
            comment: commentId, // THE FIX: Changed from 'video' to 'comment'
            likedBy: req.user._id,
        });
        return res.status(201).json(new ApiResponse(201, { isLiked: true }, "Comment liked successfully"));
    }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Tweet ID");
    }

    const existingLike = await Like.findOne({
        tweet: tweetId, // THE FIX: Changed from 'video' to 'tweet'
        likedBy: req.user._id,
    });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200).json(new ApiResponse(200, { isLiked: false }, "Tweet like removed"));
    } else {
        await Like.create({
            tweet: tweetId, // THE FIX: Changed from 'video' to 'tweet'
            likedBy: req.user._id,
        });
        return res.status(201).json(new ApiResponse(201, { isLiked: true }, "Tweet liked successfully"));
    }
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const likes = await Like.find({ 
        likedBy: req.user._id, 
        video: { $exists: true, $ne: null } 
    }).populate({
        path: "video",
        populate: {
            path: "owner",
            select: "username fullName avatar"
        }
    });

    const videos = likes.map(like => like.video);

    return res.status(200).json(new ApiResponse(200, videos, "Liked videos fetched successfully"));
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
};