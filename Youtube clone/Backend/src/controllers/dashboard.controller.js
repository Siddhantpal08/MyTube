import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
    const channelId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    // --- Your Existing Stat Calculations ---
    const totalVideos = await Video.countDocuments({ owner: channelId });

    const videoViews = await Video.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(channelId) } },
        { $group: { _id: null, totalViews: { $sum: "$views" } } },
    ]);
    const totalViews = videoViews.length > 0 ? videoViews[0].totalViews : 0;

    const userVideoIds = await Video.find({ owner: channelId }).distinct("_id");
    const totalLikes = await Like.countDocuments({ video: { $in: userVideoIds } });
    
    const totalSubscribers = await Subscription.countDocuments({ channel: channelId });

    // --- NEW: Logic for the "Last 30 Days" Chart ---
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const likesLast30Days = await Like.aggregate([
        {
            // Stage 1: Filter likes for the user's videos within the last 30 days
            $match: {
                video: { $in: userVideoIds },
                createdAt: { $gte: thirtyDaysAgo },
            },
        },
        {
            // Stage 2: Group likes by the date they were created
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 },
            },
        },
        {
            // Stage 3: Sort the results by date
            $sort: { _id: 1 },
        },
        {
            // Stage 4: Reshape the output to what the frontend chart expects
            $project: {
                _id: 0,
                date: "$_id",
                views: "$count", // Renaming to 'views' for frontend consistency
            },
        },
    ]);

    // --- Final Combined Response ---
    return res.status(200).json(
        new ApiResponse(200, {
            totalVideos,
            totalViews,
            totalLikes,
            totalSubscribers,
            viewsLast30Days: likesLast30Days, // Include the new chart data
        }, "Channel stats fetched successfully")
    );
});


const getChannelVideos = asyncHandler(async (req, res) => {
    const channelId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const videos = await Video.find({ owner: channelId })
        .select("title description thumbnail views createdAt")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, videos, "Channel videos fetched successfully")
    );
});


export {
    getChannelStats, 
    getChannelVideos
}