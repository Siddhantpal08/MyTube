import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { Comment } from "../models/comment.model.js"; // Needed for cascading delete/cleanup
import { Like } from "../models/like.model.js"; // Needed for cascading delete/cleanup
import { Playlist } from "../models/playlist.model.js"; // Needed for cascading delete/cleanup

// --- HELPER FUNCTION TO ENSURE SECURE URLS ---
const secureUrl = (url) => {
    if (url && url.startsWith('http://')) {
        return url.replace('http://', 'https://');
    }
    return url;
};


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 12, sortBy, sortType, userId, username } = req.query;

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
    
    // 1. Lookup the owner details
    pipeline.push({
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner",
            pipeline: [ { $project: { username: 1, avatar: 1, fullName: 1 } } ]
        }
    });
    
    // 2. Flatten the owner array
    pipeline.push({ $addFields: { owner: { $first: "$owner" } } });

    // 3. Add $project to explicitly select all fields (Fixes NaN:NaN issue)
    pipeline.push({
        $project: {
            _id: 1,
            title: 1,
            description: 1,
            thumbnail: 1,
            videofile: 1,
            duration: 1,
            views: 1,
            createdAt: 1,
            isPublished: 1,
            owner: 1, 
        }
    });

    // 4. Sorting
    const sortStage = {};
    sortStage[sortBy || 'createdAt'] = sortType === 'asc' ? 1 : -1;
    pipeline.push({ $sort: sortStage });

    // 5. Pagination
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

    // First, we find the video and increment its view count.
    const videoExists = await Video.findOneAndUpdate(
        { _id: videoId, isPublished: true },
        { $inc: { views: 1 } }
    );

    if (!videoExists) {
        throw new ApiError(404, "Video not found or is not published");
    }

    // Aggregation pipeline to fetch video details
    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    { $project: { username: 1, fullName: 1, avatar: 1 } }
                ]
            }
        },
        {
            $addFields: {
                owner: { $first: "$ownerDetails" }
            }
        },
        { $project: { ownerDetails: 0 } }
    ]);
    
    if (!video.length) {
        throw new ApiError(404, "Video not found after aggregation");
    }

    // Add to watch history for the logged-in user
    if (req.user) {
        const userId = req.user._id;
    
        // 1. Remove the video ID if it's already there (to avoid duplicates, needed for $pull)
        const user = await User.findByIdAndUpdate(
            userId,
            {
                $pull: { watchHistory: new mongoose.Types.ObjectId(videoId) } 
            },
            { new: true }
        );
    
        if (user) {
            // 2. Add the video ID to the beginning of the array (most recent)
            user.watchHistory.unshift(new mongoose.Types.ObjectId(videoId)); 
            
            // 3. Limit the array size 
            if (user.watchHistory.length > 20) {
                user.watchHistory.pop(); // Remove the oldest item
            }
            
            await user.save({ validateBeforeSave: false });
        }
    }
    
    const finalVideo = video[0];

    // Secure URLs before sending
    finalVideo.thumbnail = secureUrl(finalVideo.thumbnail);
    finalVideo.videofile = secureUrl(finalVideo.videofile);
    if (finalVideo.owner) {
        finalVideo.owner.avatar = secureUrl(finalVideo.owner.avatar);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, finalVideo, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    // We expect the request body to contain title, description, and/or a new thumbnail file
    const { title, description } = req.body; 
    // The file path comes from the multer middleware if a new file was uploaded
    const thumbnailFilePath = req.file?.path; 

    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    // Authorization check
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
        
        // Delete the old thumbnail from Cloudinary if it exists
        if (video.thumbnail) await deleteFromCloudinary(video.thumbnail);
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId, 
        { $set: updates }, 
        { new: true } // Return the updated document
    );
    
    return res.status(200).json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    // Authorization check
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this video");
    }

    // Delete files from Cloudinary
    await Promise.all([
        deleteFromCloudinary(video.videofile, "video"),
        deleteFromCloudinary(video.thumbnail)
    ]);

    // Delete the video document
    await Video.findByIdAndDelete(videoId);

    // --- Cleanup/Cascading Delete (CRITICAL) ---
    await Promise.all([
        // 1. Remove video from all user watch histories
        User.updateMany({}, { $pull: { watchHistory: videoId } }),
        // 2. Delete all related comments
        Comment.deleteMany({ video: videoId }),
        // 3. Delete all related likes
        Like.deleteMany({ video: videoId }),
        // 4. Remove video from all playlists
        Playlist.updateMany({}, { $pull: { videos: videoId } }),
    ]);
    
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