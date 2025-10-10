import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../Api/axiosClient';
import toast from 'react-hot-toast';
import { timeSince, formatCompactNumber, placeholderAvatar } from '../utils/formatters';

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
        // The outer div is now the container with relative positioning
        <div className="relative group flex items-start w-full gap-4 p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800">
            {/* The Link now only wraps the content, not the delete button */}
            <Link to={`/watch/${video._id}`} className="flex items-start w-full gap-4">
                <div className="w-1/3 max-w-xs aspect-video rounded-xl overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-700">
                    <img src={video.thumbnail || placeholderThumbnail} alt={video.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"/>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-red-500">{video.title || "Untitled Video"}</h3>
                    <div className="flex items-center space-x-2 mt-2">
                        <img src={avatarUrl || placeholderAvatar} alt={video.owner?.username} className="w-6 h-6 rounded-full" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">{video.owner?.username || "Unknown User"}</p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">{video.description || "No description."}</p>
                    <p className="text-xs text-gray-500 mt-2">{formatCompactNumber(video.views || 0)} views • {timeSince(video.createdAt)}</p>
                </div>
            </Link>
            
            {/* The Delete button is now a direct child of the main div */}
            <button
                onClick={(e) => {
                    e.stopPropagation(); // Stop event from bubbling up
                    onRemove(video._id); // This will now correctly call the function from the parent
                }}
                className="absolute top-2 right-2 p-1 rounded-full text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-black/50 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                title="Remove from history"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
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
                const response = await axiosClient.get('/users/history');
                setHistory(response.data.data || []);
            } catch (err) {
                console.error("Failed to fetch watch history:", err);
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

    const handleRemoveFromHistory = async (videoId) => {
        // Optimistically remove the video from the UI
        setHistory(prevHistory => prevHistory.filter(video => video._id !== videoId));
        try {
            await axiosClient.delete(`/users/history/${videoId}`);
            toast.success("Removed from watch history");
        } catch (err) {
            toast.error("Failed to remove video from history.");
            // In a real app, you might want to re-fetch the history here to revert the UI on failure
        }
    };

    if (loading) { return <div className="text-center p-8 text-xl font-medium">Loading your history...</div>; }
    if (error) { return <div className="text-center p-8 text-red-500 bg-red-100 dark:bg-red-900 dark:text-red-300 rounded-lg max-w-lg mx-auto mt-10">{error}</div>; }

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
            <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white border-b pb-3 border-gray-200 dark:border-gray-700">
                Watch History
            </h1>
            <div className="space-y-3 sm:space-y-6">
                {history.length > 0 ? (
                    // --- 2. THE SECOND FIX: Pass the 'onRemove' prop to each card ---
                    history.map(video => <HistoryVideoCard key={video._id} video={video} onRemove={handleRemoveFromHistory} />)
                ) : (
                    <div className="text-center py-16 rounded-lg bg-gray-100 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">No watch history</h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Videos you watch will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default HistoryPage;