import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

// --- HELPER FUNCTION TO ENSURE SECURE URLS ---
const secureUrl = (url) => {
    if (url && url.startsWith('http://')) {
        return url.replace('http://', 'https://');
    }
    return url;
};


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 12, query, sortBy, sortType, userId, username } = req.query;

    const pipeline = [];
    const match = {};

    if (username) {
        const user = await User.findOne({ username: username.toLowerCase() });
        if (user) {
            match.owner = user._id;
        } else {
            return res.status(200).json(new ApiResponse(200, { docs: [] }, "User not found"));
        }
    } else if (userId) {
        if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid userId");
        match.owner = new mongoose.Types.ObjectId(userId);
    }

    match.isPublished = true;

    if (Object.keys(match).length > 0) {
        pipeline.push({ $match: match });
    }
    
    pipeline.push({
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner",
            pipeline: [ { $project: { username: 1, avatar: 1, fullName: 1 } } ]
        }
    });
    pipeline.push({ $addFields: { owner: { $first: "$owner" } } });

    const sortStage = {};
    sortStage[sortBy || 'createdAt'] = sortType === 'asc' ? 1 : -1;
    pipeline.push({ $sort: sortStage });

    const videoAggregate = Video.aggregate(pipeline);
    const options = { page: parseInt(page, 10), limit: parseInt(limit, 10) };
    const videos = await Video.aggregatePaginate(videoAggregate, options);

    // Secure all URLs before sending the response
    videos.docs.forEach(video => {
        video.thumbnail = secureUrl(video.thumbnail);
        video.videofile = secureUrl(video.videofile);
        if (video.owner) {
            video.owner.avatar = secureUrl(video.owner.avatar);
        }
    });

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

    const [videoUpload, thumbnailUpload] = await Promise.all([
        uploadOnCloudinary(videoFilePath),
        uploadOnCloudinary(thumbnailFilePath)
    ]);

    if (!videoUpload?.url || !thumbnailUpload?.url) {
        throw new ApiError(500, "File upload to Cloudinary failed");
    }

    let video = await Video.create({
        title,
        description,
        videofile: videoUpload.url,
        thumbnail: thumbnailUpload.url,
        duration: Math.round(videoUpload.duration),
        owner: req.user._id,
    });

    video = await video.populate("owner", "username avatar");

    return res.status(201).json(new ApiResponse(201, video, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findOneAndUpdate(
        {
            _id: videoId,
            isPublished: true // Ensure the video is published
        },
        { $inc: { views: 1 } },
        { new: true }
    ).populate("owner", "username fullName avatar");

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (req.user) {
        await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { watchHistory: videoId },
        });
    }

    // Secure URLs before sending
    video.thumbnail = secureUrl(video.thumbnail);
    video.videofile = secureUrl(video.videofile);
    if (video.owner) {
        video.owner.avatar = secureUrl(video.owner.avatar);
    }

    return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;
    const thumbnailFilePath = req.file?.path;

    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video");
    }

    const updates = {};
    if (title) updates.title = title;
    if (description) updates.description = description;

    if (thumbnailFilePath) {
        const newThumbnail = await uploadOnCloudinary(thumbnailFilePath);
        if (!newThumbnail.url) throw new ApiError(500, "Thumbnail upload failed");
        updates.thumbnail = newThumbnail.url;
        if (video.thumbnail) await deleteFromCloudinary(video.thumbnail);
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId, { $set: updates }, { new: true });
    
    return res.status(200).json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this video");
    }

    // Delete files from Cloudinary
    await Promise.all([
        deleteFromCloudinary(video.videofile, "video"),
        deleteFromCloudinary(video.thumbnail)
    ]);

    await Video.findByIdAndDelete(videoId);

    // TODO: Also remove this video from any likes, comments, playlists, etc.
    return res.status(200).json(new ApiResponse(200, {}, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to change the publish status");
    }

    video.isPublished = !video.isPublished;
    await video.save({ validateBeforeSave: false });

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