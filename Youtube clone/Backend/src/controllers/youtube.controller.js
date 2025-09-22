import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiCache } from "../models/apiCache.model.js";
import axios from "axios";

const searchVideos = asyncHandler(async (req, res) => {
    const { query, pageToken } = req.query;
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!query) throw new ApiError(400, "Search query is required");
    if (!apiKey) throw new ApiError(500, "YouTube API key is not configured");
    
    try {
        const searchApiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&key=${apiKey}&maxResults=12&type=video${pageToken ? `&pageToken=${pageToken}`: ''}`;
        const searchResponse = await axios.get(searchApiUrl);
        const videoItems = searchResponse.data.items;

        if (videoItems.length === 0) {
            return res.status(200).json(new ApiResponse(200, { videos: [], nextPageToken: null }, "No videos found"));
        }

        const videoIds = videoItems.map(item => item.id.videoId);
        const channelIds = [...new Set(videoItems.map(item => item.snippet.channelId))];

        const [detailsResponse, channelsResponse] = await Promise.all([
            axios.get(`https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds.join(',')}&key=${apiKey}`),
            axios.get(`https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelIds.join(',')}&key=${apiKey}`)
        ]);

        const videoStats = detailsResponse.data.items.reduce((acc, item) => ({ ...acc, [item.id]: item.statistics }), {});
        const channelAvatars = channelsResponse.data.items.reduce((acc, item) => ({ ...acc, [item.id]: item.snippet.thumbnails.default.url }), {});

        const simplifiedResults = videoItems.map(item => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.high.url,
            channelTitle: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt,
            views: videoStats[item.id.videoId]?.viewCount || 0,
            owner: { 
                username: item.snippet.channelTitle, 
                avatar: channelAvatars[item.snippet.channelId] || ""
            },
        }));

        const responseData = { videos: simplifiedResults, nextPageToken: searchResponse.data.nextPageToken };
        
        return res.status(200).json(new ApiResponse(200, responseData, "YouTube search successful"));
    } catch (error) {
        throw new ApiError(500, "Failed to fetch data from YouTube");
    }
});

const getVideoDetails = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const apiKey = process.env.YOUTUBE_API_KEY;
    const cacheKey = `video:${videoId}`;

    if (!videoId) throw new ApiError(400, "YouTube Video ID is required");
    if (!apiKey) throw new ApiError(500, "YouTube API key is not configured");

    // --- Step 1: Check the cache first ---
    const cachedData = await ApiCache.findOne({ query: cacheKey });
    if (cachedData) {
        console.log("Serving video details from CACHE");
        return res.status(200).json(
            new ApiResponse(200, cachedData.response, "YouTube video details fetched (from cache)")
        );
    }
    
    // --- Step 2: If not in cache, call the API (Cache Miss) ---
    console.log("Serving video details from API, UPDATING CACHE");
    try {
        const videoApiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`;
        const videoResponse = await axios.get(videoApiUrl);
        if (videoResponse.data.items.length === 0) {
            throw new ApiError(404, "Video not found on YouTube");
        }
        
        const item = videoResponse.data.items[0];
        const channelId = item.snippet.channelId;
        
        const channelApiUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`;
        const channelResponse = await axios.get(channelApiUrl);
        const subscriberCount = channelResponse.data.items[0]?.statistics.subscriberCount || 0;

        const simplifiedResult = {
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.high.url,
            videofile: null,
            owner: { username: item.snippet.channelTitle, avatar: "" },
            views: item.statistics.viewCount,
            createdAt: item.snippet.publishedAt,
            subscribersCount: parseInt(subscriberCount, 10),
        };

        // --- Step 3: Save the new result to the cache ---
        await ApiCache.findOneAndUpdate(
            { query: cacheKey },
            { response: simplifiedResult },
            { upsert: true, new: true }
        );
        
        return res.status(200).json(
            new ApiResponse(200, simplifiedResult, "YouTube video details fetched")
        );
    } catch (error) {
        console.error("Error fetching YouTube video details:", error.response?.data?.error);
        throw new ApiError(500, "Failed to fetch video details from YouTube");
    }
});


const getYouTubeComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { pageToken } = req.query;
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!videoId) throw new ApiError(400, "Video ID is required");

    const apiUrl = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&key=${apiKey}&maxResults=20${pageToken ? `&pageToken=${pageToken}` : ''}`;

    try {
        const response = await axios.get(apiUrl);
        const nextPageToken = response.data.nextPageToken;
        
        const simplifiedComments = response.data.items.map(item => {
            const comment = item.snippet.topLevelComment.snippet;
            return {
                _id: item.id,
                content: comment.textDisplay,
                owner: {
                    username: comment.authorDisplayName,
                    avatar: comment.authorProfileImageUrl
                },
                createdAt: comment.publishedAt,
            };
        });

        const responseData = {
            docs: simplifiedComments,
            pageInfo: response.data.pageInfo, // This contains the totalResults
            hasNextPage: !!nextPageToken,
            nextPageToken: nextPageToken,
        };

        return res.status(200).json(new ApiResponse(200, responseData, "YouTube comments fetched"));
    } catch (error) {
        if (error.response?.data?.error?.errors[0]?.reason === 'commentsDisabled') {
            return res.status(200).json(new ApiResponse(200, { docs: [], pageInfo: { totalResults: 0 } }, "Comments are disabled"));
        }
        throw new ApiError(500, "Failed to fetch YouTube comments");
    }
});

export { searchVideos, getVideoDetails, getYouTubeComments };