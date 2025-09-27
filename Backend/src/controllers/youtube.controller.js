import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiCache } from "../models/apiCache.model.js";
import axios from "axios";

// --- Main Controllers ---

const searchVideos = asyncHandler(async (req, res) => {
    const { query, pageToken } = req.query;
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!query) throw new ApiError(400, "Search query is required");
    if (!apiKey) {
        console.error("FATAL: YOUTUBE_API_KEY is not configured on the server.");
        throw new ApiError(500, "Server is not configured correctly.");
    }

    const cacheKey = `Youtube:${query}:${pageToken || 'default'}`;

    // 1. Check for a recent result in the cache
    const cachedData = await ApiCache.findOne({ query: cacheKey });
    if (cachedData) {
        console.log(`Serving search results for "${query}" from CACHE`);
        return res.status(200).json(new ApiResponse(200, cachedData.response, "YouTube search results fetched (from cache)"));
    }

    // 2. If not in cache, call the API
    console.log(`Serving search results for "${query}" from API, UPDATING CACHE`);
    const searchApiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&key=${apiKey}&maxResults=12&type=video${pageToken ? `&pageToken=${pageToken}` : ''}`;

    try {
        const response = await axios.get(searchApiUrl, { timeout: 10000 });
        
        const responseData = {
            videos: response.data.items.map(item => ({
                videoId: item.id.videoId,
                title: item.snippet.title,
                description: item.snippet.description,
                thumbnail: item.snippet.thumbnails.high.url,
                channelTitle: item.snippet.channelTitle,
                publishTime: item.snippet.publishTime,
            })),
            nextPageToken: response.data.nextPageToken,
            hasNextPage: !!response.data.nextPageToken,
        };

        // 3. Save the new, successful result to the cache for future requests
        await ApiCache.create({ query: cacheKey, response: responseData });

        return res.status(200).json(new ApiResponse(200, responseData, "YouTube search results fetched successfully"));

    } catch (error) {
        // 4. This specifically checks for Google's quota error and sends a 429 to the client
        if (error.response && error.response.status === 403 && error.response.data?.error?.errors[0]?.reason === 'quotaExceeded') {
            console.error("YOUTUBE API QUOTA EXCEEDED!");
            throw new ApiError(429, "YouTube API quota exceeded. Please try again tomorrow.");
        }
        
        console.error("Error fetching from YouTube API:", error.message);
        throw new ApiError(500, "Failed to fetch search results from YouTube");
    }
});

// IMPORTANT: Remember to add this same caching and error-handling pattern to your
// getVideoDetails and getYouTubeComments functions to protect your quota there as well.

export { searchVideos };

const getVideoDetails = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const apiKey = process.env.YOUTUBE_API_KEY;
    const cacheKey = `video:${videoId}`;

    if (!videoId) throw new ApiError(400, "YouTube Video ID is required");
    if (!apiKey) throw new ApiError(500, "YouTube API key is not configured on the server");

    // Check cache first
    const cachedData = await ApiCache.findOne({ query: cacheKey });
    if (cachedData) {
        console.log(`Serving video details for ${videoId} from CACHE`);
        return res.status(200).json(
            new ApiResponse(200, cachedData.response, "YouTube video details fetched (from cache)")
        );
    }

    // If not in cache, call the API
    console.log(`Serving video details for ${videoId} from API, UPDATING CACHE`);
    try {
        const videoApiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`;
        const videoResponse = await axios.get(videoApiUrl, { timeout: 10000 });

        if (!videoResponse.data.items || videoResponse.data.items.length === 0) {
            throw new ApiError(404, "Video not found on YouTube");
        }

        const item = videoResponse.data.items[0];
        const channelId = item.snippet.channelId;

        const channelApiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`;
        const channelResponse = await axios.get(channelApiUrl, { timeout: 10000 });
        
        const channelItem = channelResponse.data.items[0];
        const subscriberCount = channelItem?.statistics.subscriberCount || 0;
        const channelAvatar = channelItem?.snippet.thumbnails.default.url || "";

        const simplifiedResult = {
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.high.url,
            owner: { 
                username: item.snippet.channelTitle, 
                avatar: channelAvatar,
                subscribers: parseInt(subscriberCount, 10),
            },
            views: parseInt(item.statistics.viewCount, 10),
            likes: parseInt(item.statistics.likeCount, 10),
            createdAt: item.snippet.publishedAt,
        };

        // Save the new result to the cache
        await ApiCache.findOneAndUpdate(
            { query: cacheKey },
            { response: simplifiedResult },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return res.status(200).json(
            new ApiResponse(200, simplifiedResult, "YouTube video details fetched successfully")
        );
    } catch (error) {
        logApiError(error, "getVideoDetails");
        throw new ApiError(500, "Failed to fetch video details from YouTube");
    }
});

const getYouTubeComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { pageToken } = req.query;
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!videoId) throw new ApiError(400, "Video ID is required");

    const apiUrl = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&key=${apiKey}&maxResults=20&order=relevance${pageToken ? `&pageToken=${pageToken}` : ''}`;

    try {
        const response = await axios.get(apiUrl, { timeout: 10000 });
        const nextPageToken = response.data.nextPageToken;

        const simplifiedComments = response.data.items.map(item => {
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
        });

        const responseData = {
            comments: simplifiedComments,
            totalResults: response.data.pageInfo.totalResults,
            nextPageToken: nextPageToken,
            hasNextPage: !!nextPageToken,
        };

        return res.status(200).json(
            new ApiResponse(200, responseData, "YouTube comments fetched successfully")
        );
    } catch (error) {
        if (error.response?.data?.error?.errors[0]?.reason === 'commentsDisabled') {
            return res.status(200).json(
                new ApiResponse(200, { comments: [], totalResults: 0 }, "Comments are disabled for this video")
            );
        }
        logApiError(error, "getYouTubeComments");
        throw new ApiError(500, "Failed to fetch YouTube comments");
    }
});

// --- Helper function for logging ---

function logApiError(error, functionName) {
    console.error(`\n--- ERROR IN ${functionName.toUpperCase()} ---`);
    console.error(`Timestamp: ${new Date().toISOString()}`);
    if (error.code === 'ECONNABORTED') {
        console.error("Error Type: Timeout. The request took too long to complete.");
    } else if (error.response) {
        console.error("Error Type: API Response Error (from Google)");
        console.error("Status:", error.response.status);
        console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
        console.error("Error Type: No Response. The request was made but no response was received.");
    } else {
        console.error("Error Type: Request Setup Error");
        console.error("Message:", error.message);
    }
    console.error(`--- END ERROR LOG ---\n`);
}

export { searchVideos, getVideoDetails, getYouTubeComments };