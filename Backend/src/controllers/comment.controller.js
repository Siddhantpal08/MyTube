import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import axios from "axios";

// A smart controller that gets all comments for ANY video (internal or external)
const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10, pageToken } = req.query;
    const isInternal = mongoose.isValidObjectId(videoId);

    let internalCommentsResult = { docs: [], totalDocs: 0, hasNextPage: false };
    let youtubeCommentsResult = { docs: [], totalResults: 0, nextPageToken: null, hasNextPage: false };
    let commentsDisabled = false;

    if (isInternal) {
        // --- Fetch paginated comments for your OWN videos ---
        const aggregate = Comment.aggregate([{ $match: { video: new mongoose.Types.ObjectId(videoId) } }]);
        const options = { page, limit, populate: { path: "owner", select: "username fullName avatar" }, sort: { createdAt: -1 } };
        internalCommentsResult = await Comment.aggregatePaginate(aggregate, options);
    } else {
        // --- Fetch comments for EXTERNAL YouTube videos ---
        // 1. Fetch your site's comments for this YouTube video ID
        const internalAggregate = Comment.aggregate([{ $match: { youtubeVideoId: videoId } }]);
        const internalOptions = { page: 1, limit: 100, populate: { path: "owner", select: "username fullName avatar" }, sort: { createdAt: -1 } }; // Fetch all internal for now
        internalCommentsResult = await Comment.aggregatePaginate(internalAggregate, internalOptions);
        
        // 2. Fetch comments from the YouTube API
        try {
            const apiKey = process.env.YOUTUBE_API_KEY;
            const apiUrl = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&key=${apiKey}&maxResults=10&order=relevance${pageToken ? `&pageToken=${pageToken}` : ''}`;
            const ytResponse = await axios.get(apiUrl, { timeout: 8000 });
            
            youtubeCommentsResult.docs = ytResponse.data.items.map(item => {
                const c = item.snippet.topLevelComment.snippet;
                return { _id: item.id, content: c.textDisplay, owner: { username: c.authorDisplayName, avatar: c.authorProfileImageUrl }, createdAt: c.publishedAt, isExternal: true };
            });
            youtubeCommentsResult.totalResults = ytResponse.data.pageInfo.totalResults;
            youtubeCommentsResult.nextPageToken = ytResponse.data.nextPageToken;
            youtubeCommentsResult.hasNextPage = !!ytResponse.data.nextPageToken;
        } catch (error) {
            if (error.response?.data?.error?.errors[0]?.reason === 'commentsDisabled') {
                commentsDisabled = true;
            } else {
                console.error("Failed to fetch YouTube comments:", error.message);
            }
        }
    }

    const responseData = {
        comments: internalCommentsResult.docs.concat(youtubeCommentsResult.docs),
        totalComments: (internalCommentsResult.totalDocs || 0) + (youtubeCommentsResult.totalResults || 0),
        hasNextPage: internalCommentsResult.hasNextPage || youtubeCommentsResult.hasNextPage,
        nextPageToken: youtubeCommentsResult.nextPageToken, // For YouTube pagination
        nextPage: internalCommentsResult.nextPage, // For internal pagination
        commentsDisabled,
    };
    
    return res.status(200).json(new ApiResponse(200, responseData, "Comments fetched successfully"));
});

// A smart controller that adds a comment to the correct video type
const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;
    const isInternal = mongoose.isValidObjectId(videoId);

    if (!content?.trim()) throw new ApiError(400, "Content is required");

    if (!isInternal) { // If it's a YouTube video, there's no "Video" document in your DB
        const comment = await Comment.create({
            content,
            owner: req.user._id,
            youtubeVideoId: videoId
        });
        const createdComment = await Comment.findById(comment._id).populate("owner", "username fullName avatar");
        return res.status(201).json(new ApiResponse(201, createdComment, "Comment added successfully"));
    }
    
    // If it's an internal video
    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id,
    });

    const createdComment = await Comment.findById(comment._id).populate("owner", "username fullName avatar");
    if (!createdComment) throw new ApiError(500, "Failed to create comment");

    return res.status(201).json(new ApiResponse(201, createdComment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;
 
    if (!content) throw new ApiError(400, "Content is required");
    if (!mongoose.isValidObjectId(commentId)) throw new ApiError(400, "Invalid Comment ID");
 
    const comment = await Comment.findOneAndUpdate(
        { _id: commentId, owner: req.user._id },
        { $set: { content } },
        { new: true }
    );
 
    if (!comment) {
        throw new ApiError(404, "Comment not found or you are not the owner");
    }
 
    return res.status(200).json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    if (!mongoose.isValidObjectId(commentId)) throw new ApiError(400, "Invalid Comment ID");

    const comment = await Comment.findOneAndDelete({
        _id: commentId,
        owner: req.user._id
    });

    if (!comment) {
        throw new ApiError(404, "Comment not found or you are not the owner");
    }
 
    return res.status(200).json(new ApiResponse(200, { _id: commentId }, "Comment deleted successfully"));
});


export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment,
};