import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../Api/axiosClient';
import { timeSince, formatCompactNumber, placeholderAvatar } from '../utils/formatters';

// A specialized card for the history list view, now with theme-aware styles
const HistoryVideoCard = ({ video }) => {
    // Robustly handle avatar URL, whether it's a direct string or an object
    let avatarUrl = typeof video.owner?.avatar === 'string' 
        ? video.owner.avatar 
        : video.owner?.avatar?.url;
    if (avatarUrl && avatarUrl.startsWith('http://')) {
        avatarUrl = avatarUrl.replace('http://', 'https://');
    }

    return (
        <Link to={`/watch/${video._id}`} className="flex items-start w-full gap-4 group p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <div className="w-1/3 max-w-xs aspect-video rounded-xl overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-700">
                <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
            </div>
            <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-red-500">
                    {video.title}
                </h3>
                <div className="flex items-center space-x-2 mt-2">
                    <img src={avatarUrl || placeholderAvatar} alt={video.owner?.username} className="w-6 h-6 rounded-full" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">{video.owner?.username}</p>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                    {video.description}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                    {formatCompactNumber(video.views)} views • {timeSince(video.createdAt)}
                </p>
            </div>
        </Link>
    );
};


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
                setError("Could not load your watch history.");
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    if (loading) {
        return <div className="text-center p-8">Loading your history...</div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-500">{error}</div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 border-b pb-3 border-gray-200 dark:border-gray-700">
                Watch History
            </h1>
            <div className="space-y-6">
                {history.length > 0 ? (
                    history.map(video => <HistoryVideoCard key={video._id} video={video} />)
                ) : (
                    <div className="text-center py-16 rounded-lg bg-gray-100 dark:bg-gray-800">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">No watch history</h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Videos you watch will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default HistoryPage;