import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiCache } from "../models/apiCache.model.js";
import axios from "axios";

// --- Helper function for logging API errors ---
const logApiError = (error, functionName) => {
    console.error(`\n--- ERROR IN ${functionName.toUpperCase()} ---`);
    if (error.response) {
        console.error("Error Type: API Response Error (from Google)");
        console.error("Status:", error.response.status);
        console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
        console.error("Error Type: Network or Setup Error");
        console.error("Message:", error.message);
    }
    console.error(`--- END ERROR LOG ---\n`);
};

// --- Controller for Searching Videos (with Rich Data) ---
const searchVideos = asyncHandler(async (req, res) => {
    const { query, pageToken } = req.query;
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!query) throw new ApiError(400, "Search query is required");
    if (!apiKey) throw new ApiError(500, "YouTube API key is not configured");

    const cacheKey = `yt-search-rich:${query}:${pageToken || 'p1'}`;

    const cachedData = await ApiCache.findOne({ query: cacheKey });
    if (cachedData) {
        console.log(`Serving RICH search results for "${query}" from CACHE`);
        return res.status(200).json(new ApiResponse(200, cachedData.response, "YouTube search results fetched (from cache)"));
    }

    console.log(`Serving RICH search results for "${query}" from API, UPDATING CACHE`);
    
    try {
        // Step 1: Get Video IDs from Search API
        const searchApiUrl = `https://www.googleapis.com/youtube/v3/search?part=id&q=${encodeURIComponent(query)}&key=${apiKey}&maxResults=12&type=video${pageToken ? `&pageToken=${pageToken}` : ''}`;
        const searchResponse = await axios.get(searchApiUrl, { timeout: 10000 });
        const videoIds = searchResponse.data.items.map(item => item.id.videoId).join(',');
        if (!videoIds) return res.status(200).json(new ApiResponse(200, { videos: [], hasNextPage: false }, "No videos found"));

        // Step 2: Get Rich Details for all videos
        const videosApiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${apiKey}`;
        const detailsResponse = await axios.get(videosApiUrl, { timeout: 10000 });
        const videoItems = detailsResponse.data.items;

        // --- THE FIX: GET CHANNEL AVATARS ---
        // Step 2.5: Get all unique Channel IDs from the video details
        const channelIds = [...new Set(videoItems.map(item => item.snippet.channelId))].join(',');

        // Step 2.6: Make one efficient API call to get all channel details
        const channelsApiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelIds}&key=${apiKey}`;
        const channelsResponse = await axios.get(channelsApiUrl, { timeout: 10000 });
        
        // Create a quick lookup map for channel avatars
        const channelAvatars = channelsResponse.data.items.reduce((acc, item) => {
            acc[item.id] = item.snippet.thumbnails.default.url;
            return acc;
        }, {});
        // --- END FIX ---

        // Step 3: Combine all data into the final response
        const responseData = {
            videos: videoItems.map(item => ({
                videoId: item.id,
                title: item.snippet.title,
                thumbnail: item.snippet.thumbnails.high.url,
                channelTitle: item.snippet.channelTitle,
                publishTime: item.snippet.publishedAt,
                views: parseInt(item.statistics.viewCount || 0, 10),
                duration: item.contentDetails.duration,
                // THE FIX: Add the owner object with the avatar for YouTube videos
                owner: {
                    username: item.snippet.channelTitle,
                    avatar: channelAvatars[item.snippet.channelId] || "",
                }
            })),
            nextPageToken: searchResponse.data.nextPageToken,
            hasNextPage: !!searchResponse.data.nextPageToken,
        };
        
        await ApiCache.create({ query: cacheKey, response: responseData });
        return res.status(200).json(new ApiResponse(200, responseData, "YouTube search results fetched successfully"));

    } catch (error) {
        if (error.response?.data?.error?.errors[0]?.reason === 'quotaExceeded') {
            console.error("YOUTUBE API QUOTA EXCEEDED!");
            throw new ApiError(429, "YouTube API quota exceeded. Please try again tomorrow.");
        }
        console.error("Error fetching from YouTube API:", error.message);
        throw new ApiError(500, "Failed to fetch search results from YouTube");
    }
});

// --- Controller for Getting Video Details ---
const getVideoDetails = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!videoId) throw new ApiError(400, "Video ID is required");

    const cacheKey = `yt-video:${videoId}`;
    const cachedData = await ApiCache.findOne({ query: cacheKey });
    if (cachedData) {
        console.log(`Serving video details for "${videoId}" from CACHE`);
        return res.status(200).json(new ApiResponse(200, cachedData.response, "Video details fetched (from cache)"));
    }

    console.log(`Serving video details for "${videoId}" from API, UPDATING CACHE`);
    const videoApiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`;

    try {
        const videoResponse = await axios.get(videoApiUrl, { timeout: 10000 });
        if (!videoResponse.data.items?.length) throw new ApiError(404, "Video not found");

        const item = videoResponse.data.items[0];
        const channelId = item.snippet.channelId;
        const channelApiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`;
        const channelResponse = await axios.get(channelApiUrl, { timeout: 10000 });
        
        const channelItem = channelResponse.data.items[0];
        const simplifiedResult = {
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.high.url,
            owner: { 
                username: item.snippet.channelTitle, 
                avatar: channelItem?.snippet.thumbnails.default.url || "",
                subscribers: parseInt(channelItem?.statistics.subscriberCount || 0, 10),
            },
            views: parseInt(item.statistics.viewCount || 0, 10),
            likes: parseInt(item.statistics.likeCount || 0, 10),
            createdAt: item.snippet.publishedAt,
        };
        await ApiCache.create({ query: cacheKey, response: simplifiedResult });
        return res.status(200).json(new ApiResponse(200, simplifiedResult, "Video details fetched successfully"));
    } catch (error) {
        logApiError(error, "getVideoDetails");
        if (error.response?.data?.error?.errors[0]?.reason === 'quotaExceeded') {
            throw new ApiError(429, "YouTube API quota exceeded.");
        }
        throw new ApiError(500, "Failed to fetch video details from YouTube");
    }
});

// --- Controller for Getting Video Comments ---
const getYouTubeComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { pageToken } = req.query;
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!videoId) throw new ApiError(400, "Video ID is required");

    const cacheKey = `yt-comments:${videoId}:${pageToken || 'p1'}`;
    const cachedData = await ApiCache.findOne({ query: cacheKey });
    if (cachedData) {
        console.log(`Serving comments for "${videoId}" from CACHE`);
        return res.status(200).json(new ApiResponse(200, cachedData.response, "Comments fetched (from cache)"));
    }

    console.log(`Serving comments for "${videoId}" from API, UPDATING CACHE`);
    const apiUrl = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&key=${apiKey}&maxResults=20&order=relevance${pageToken ? `&pageToken=${pageToken}` : ''}`;

    try {
        const response = await axios.get(apiUrl, { timeout: 10000 });
        const responseData = {
            comments: response.data.items.map(item => {
                const comment = item.snippet.topLevelComment.snippet;
                return {
                    _id: item.id,
                    content: comment.textDisplay,
                    owner: {
                        username: comment.authorDisplayName,
                        avatar: comment.authorProfileImageUrl,
                    },
                    createdAt: comment.publishedAt,
                    likes: comment.likeCount,
                };
            }),
            nextPageToken: response.data.nextPageToken,
        };
        await ApiCache.create({ query: cacheKey, response: responseData });
        return res.status(200).json(new ApiResponse(200, responseData, "Comments fetched successfully"));
    } catch (error) {
        logApiError(error, "getYouTubeComments");
        if (error.response?.data?.error?.errors[0]?.reason === 'commentsDisabled') {
            return res.status(200).json(new ApiResponse(200, { comments: [] }, "Comments are disabled for this video"));
        }
        if (error.response?.data?.error?.errors[0]?.reason === 'quotaExceeded') {
            throw new ApiError(429, "YouTube API quota exceeded.");
        }
        throw new ApiError(500, "Failed to fetch comments from YouTube");
    }
});

export { searchVideos, getVideoDetails, getYouTubeComments };