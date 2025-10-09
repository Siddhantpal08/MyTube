import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../Api/axiosClient';
import { timeSince, formatCompactNumber, placeholderAvatar } from '../utils/formatters';

// Define a placeholder thumbnail in case the video data is missing
const placeholderThumbnail = 'https://via.placeholder.com/320x180?text=Video+Unavailable'; 

// --- HistoryVideoCard Component (with Fallback Enhancements) ---
const HistoryVideoCard = ({ video }) => {
    // Robustly handle avatar URL, whether it's a direct string or an object
    let avatarUrl = typeof video.owner?.avatar === 'string' 
        ? video.owner.avatar 
        : video.owner?.avatar?.url;
    
    // Ensure avatar URL uses HTTPS if it starts with HTTP
    if (avatarUrl && avatarUrl.startsWith('http://')) {
        avatarUrl = avatarUrl.replace('http://', 'https://');
    }

    // Use fallback values for essential video properties
    const videoTitle = video.title || "Untitled Video";
    const videoDescription = video.description || "No description available.";
    const thumbnailUrl = video.thumbnail || placeholderThumbnail;
    const views = formatCompactNumber(video.views || 0);
    const time = timeSince(video.createdAt || new Date());
    const username = video.owner?.username || "Unknown User";

    return (
        <Link 
            to={`/watch/${video._id}`} 
            className="flex items-start w-full gap-4 group p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
            <div className="w-1/3 max-w-xs aspect-video rounded-xl overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-700">
                <img 
                    src={thumbnailUrl} 
                    alt={videoTitle}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
            </div>
            <div className="flex-1 min-w-0"> {/* Use min-w-0 to prevent overflow */}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-red-500">
                    {videoTitle}
                </h3>
                <div className="flex items-center space-x-2 mt-2">
                    {/* Use robust avatarUrl and placeholder */}
                    <img src={avatarUrl || placeholderAvatar} alt={username} className="w-6 h-6 rounded-full" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">{username}</p>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                    {videoDescription}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                    {views} views • {time}
                </p>
            </div>
        </Link>
    );
};

// --- HistoryPage Component ---
function HistoryPage() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            setError(null);
            try {
                // Call the API endpoint to fetch the user's watch history
                const response = await axiosClient.get('/users/history');
                
                // The backend API is confirmed to return data in response.data.data
                const rawHistory = response.data.data || [];
                
                // CRITICAL CHECK: Ensure the array contains actual video objects
                // Your backend's getWatchHistory aggregates the watchHistory field,
                // so the items in rawHistory should already be the video objects.
                
                // We keep the logic simple, assuming backend is fixed to return video objects
                setHistory(rawHistory);
                
            } catch (err) {
                console.error("Failed to fetch watch history:", err);
                // Check if it's a 401/403 (Unauthorized) error for better messaging
                const status = err.response?.status;
                if (status === 401 || status === 403) {
                     setError("You must be logged in to view your watch history.");
                } else {
                     setError("Could not load your watch history. Please try again.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    if (loading) {
        return <div className="text-center p-8 text-xl font-medium">Loading your history...</div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-500 bg-red-100 dark:bg-red-900 dark:text-red-300 rounded-lg max-w-lg mx-auto mt-10">{error}</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
            <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white border-b pb-3 border-gray-200 dark:border-gray-700">
                Watch History
            </h1>
            <div className="space-y-3 sm:space-y-6">
                {history.length > 0 ? (
                    // Render the list of history video cards
                    history.map(video => <HistoryVideoCard key={video._id} video={video} />)
                ) : (
                    // Display empty state message
                    <div className="text-center py-16 rounded-lg bg-gray-100 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">No watch history</h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Videos you watch will appear here once you start viewing.</p>
                        <p className="mt-4 text-sm text-red-500 dark:text-red-400">If you have watched videos, ensure you are logged in.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default HistoryPage;