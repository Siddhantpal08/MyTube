import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    const aggregate = Comment.aggregate([
        {
            $match: { video: new mongoose.Types.ObjectId(videoId) }
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
        { $unwind: "$ownerDetails" },
        { $sort: { createdAt: -1 } }, // ✅ fixed sort operator name
        {
            $project: {
                content: 1,
                createdAt: 1,
                updatedAt: 1,
                ownerDetails: 1
            }
        }
    ]);

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    };

    const comments = await Comment.aggregatePaginate(aggregate, options);

    return res
        .status(200)
        .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
    console.log("👉 req.params:", req.params);
    console.log("👉 req.body:", req.body);
    console.log("👉 req.user:", req.user);
    // TODO: add a comment to a video
    const { videoId } = req.params;
    const { content } = req.body;

    if (!content || !videoId) {
        throw new ApiError(400, "Video ID and content are required");
    }

    const comment = await Comment.create({
        video: videoId,
        owner: req.user._id,
        content
    });

    res.status(201).json(
        new ApiResponse(201, comment, "Comment added successfully")
    );

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params;
    const { content } = req.body;
  
    if (!content) {
      throw new ApiError(400, "New content is required");
    }
  
    const comment = await Comment.findById(commentId);
  
    if (!comment) {
      throw new ApiError(404, "Comment not found");
    }
  
    if (comment.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You are not allowed to edit this comment");
    }
  
    comment.content = content;
    await comment.save();
  
    res.status(200).json(
      new ApiResponse(200, comment, "Comment updated successfully")
    );  
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    const isOwner = comment.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin"; // assuming `role` exists

    if (!isOwner && !isAdmin) {
        throw new ApiError(403, "You are not allowed to delete this comment");
    }

    await comment.deleteOne();

    res.status(200).json(
        new ApiResponse(200, null, "Comment deleted successfully")
    );
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }
