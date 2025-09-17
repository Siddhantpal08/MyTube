import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js";

const getVideoLikeStatus = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    const userId = req.user?._id;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID");
    }

    const likesCount = await Like.countDocuments({ video: videoId });

    let isLiked = false;
    if (userId) {
        const userLike = await Like.findOne({ video: videoId, likedBy: userId });
        isLiked = !!userLike;
    }

    return res.status(200).json(new ApiResponse(200, { likesCount, isLiked }, "Like status fetched successfully"));
});


const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid Video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user._id
    });

    if( existingLike){
        await existingLike.deleteOne();
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Video like removed"));
    }

    const like = await Like.create({
        video: videoId,
        likedBy: req.user._id
    });

    return res
        .status(201)
        .json(new ApiResponse(201, like, "Video liked successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid Video ID");
    }

    const existingLike = await Like.findOne({
        video: commentId,
        likedBy: req.user._id
    });

    if( existingLike){
        await existingLike.deleteOne();
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Comment like removed"));
    }

    const like = await Like.create({
        video: commentId,
        likedBy: req.user._id
    });

    return res
        .status(201)
        .json(new ApiResponse(201, like, "Comment liked successfully"));

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;
    //TODO: toggle like on tweet

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Video ID");
    }

    const existingLike = await Like.findOne({
        video: tweetId,
        likedBy: req.user._id
    });

    if( existingLike){
        await existingLike.deleteOne();
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Tweet like removed"));
    }

    const like = await Like.create({
        video: tweetId,
        likedBy: req.user._id
    });

    return res
        .status(201)
        .json(new ApiResponse(201, like, "Tweet liked successfully"));
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const likes = await Like.find({ likedBy: req.user._id, video: { $ne: null } })
    .populate({
        path: "video",
        select: "title description duration createdAt thumbnail",
        populate: {
            path: "owner",
            select: "username fullName avatar"
            }
    });

    const videos = likes.map(like => like.video);

    return res.status(200).json(
        new ApiResponse(200, videos, "Fetched Liked Videos Successfully")
    );
        

});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
    getVideoLikeStatus,
}