import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query;

    const pipeline = [];

    // Match videos based on search query or user ID
    if (query) {
        pipeline.push({ $match: { $text: { $search: query } } });
    } else if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid userId");
        }
        pipeline.push({ $match: { owner: new mongoose.Types.ObjectId(userId) } });
    }

    // Only show published videos
    pipeline.push({ $match: { isPublished: true } });

    // Join with users collection to get owner details (avatar, username)
    pipeline.push({
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "ownerDetails",
        },
    });
    pipeline.push({ $unwind: "$ownerDetails" });
    
    // Define the sorting stage
    const sortStage = { $sort: { [sortBy]: sortType === 'asc' ? 1 : -1 } };
    pipeline.push(sortStage);

    // Project the final fields to send to the frontend
    pipeline.push({
        $project: {
            _id: 1,
            videofile: 1,
            thumbnail: 1,
            title: 1,
            duration: 1,
            views: 1,
            createdAt: 1,
            owner: {
                _id: "$ownerDetails._id",
                username: "$ownerDetails.username",
                avatar: "$ownerDetails.avatar",
            },
        },
    });

    const videoAggregate = Video.aggregate(pipeline);
    const options = { page: parseInt(page, 10), limit: parseInt(limit, 10) };

    const videos = await Video.aggregatePaginate(videoAggregate, options);

    return res.status(200).json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
    }

    const videoFilePath = req.files?.videoFile?.[0]?.path;
    const thumbnailFilePath = req.files?.thumbnail?.[0]?.path;

    if (!videoFilePath || !thumbnailFilePath) {
        throw new ApiError(400, "Video file and thumbnail are required");
    }

    const videoUpload = await uploadOnCloudinary(videoFilePath);
    const thumbnailUpload = await uploadOnCloudinary(thumbnailFilePath);

    if (!videoUpload?.url || !thumbnailUpload?.url) {
        throw new ApiError(500, "File upload to Cloudinary failed");
    }

    const video = await Video.create({
        title,
        description,
        videofile: videoUpload.url,
        thumbnail: thumbnailUpload.url,
        duration: Math.round(videoUpload.duration),
        owner: req.user._id,
    });

    return res.status(201).json(new ApiResponse(201, video, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Atomically increment views and get the updated video
    const video = await Video.findByIdAndUpdate(
        videoId,
        { $inc: { views: 1 } },
        { new: true } // Return the updated document
    ).populate("owner", "username avatar subscribersCount");

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Add video to user's watch history (if logged in)
    if (req.user) {
        await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { watchHistory: videoId },
        });
    }

    return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;
    const thumbnailFilePath = req.file?.path;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video");
    }

    const updates = {};
    if (title) updates.title = title;
    if (description) updates.description = description;

    // If a new thumbnail is provided, upload it and delete the old one
    if (thumbnailFilePath) {
        const newThumbnail = await uploadOnCloudinary(thumbnailFilePath);
        if (!newThumbnail.url) {
            throw new ApiError(500, "Thumbnail upload failed");
        }
        updates.thumbnail = newThumbnail.url;
        // Delete the old thumbnail from Cloudinary
        if (video.thumbnail) {
            await deleteFromCloudinary(video.thumbnail);
        }
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId, { $set: updates }, { new: true });

    return res.status(200).json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this video");
    }

    // Delete files from Cloudinary
    if (video.videofile) {
        await deleteFromCloudinary(video.videofile, "video");
    }
    if (video.thumbnail) {
        await deleteFromCloudinary(video.thumbnail);
    }

    // Delete the video document from the database
    await Video.findByIdAndDelete(videoId);

    // TODO: Also remove this video from any likes, comments, playlists, etc.

    return res.status(200).json(new ApiResponse(200, {}, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to change the publish status");
    }

    video.isPublished = !video.isPublished;
    await video.save({ validateBeforeSave: false }); // Avoids running all validators again

    return res.status(200).json(new ApiResponse(200, video, "Video publish status updated"));
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
};