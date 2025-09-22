// src/components/HistoryPage.jsx
import React, { useState, useEffect } from 'react';
import axiosClient from '../Api/axiosClient';
import { Link } from 'react-router-dom';
import { timeSince } from '../utils/formatters';

const HistoryVideoCard = ({ video }) => (
    <Link to={`/watch/${video._id}`} className="flex items-start gap-4">
        <img src={video.thumbnail} alt={video.title} className="w-64 h-36 object-cover rounded-lg flex-shrink-0" />
        <div>
            <h3 className="font-semibold text-lg text-white line-clamp-2">{video.title}</h3>
            <p className="text-sm text-gray-400 mt-1">{video.owner?.username}</p>
            <p className="text-sm text-gray-300 mt-3 line-clamp-2">{video.description}</p>
            <p className="text-xs text-gray-500 mt-2">{timeSince(video.createdAt)}</p>
        </div>
    </Link>
);

function HistoryPage() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axiosClient.get('/users/history')
            .then(res => setHistory(res.data.data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-8 text-center">Loading watch history...</div>;

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-6">Watch History</h1>
            <div className="space-y-6">
                {history.length > 0 ? (
                    history.map(video => <HistoryVideoCard key={video._id} video={video} />)
                ) : (
                    <p className="text-center text-gray-400">Your watch history is empty.</p>
                )}
            </div>
        </div>
    );
}

export default HistoryPage;