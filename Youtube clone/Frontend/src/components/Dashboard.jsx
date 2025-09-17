// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import axiosClient from '../Api/axiosClient';
import VideoCard from './VideoCard'; // Reusing our existing component

function Dashboard() {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Assuming your premade backend has an endpoint to get videos from subscribed channels
        const fetchSubscribedVideos = async () => {
            try {
                setLoading(true);
                const response = await axiosClient.get('/dashboard/videos');
                // The exact path to the videos array might differ based on your API
                setVideos(response.data.data); 
                setError(null);
            } catch (err) {
                setError("Could not fetch your subscription feed.");
                console.error("Dashboard fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSubscribedVideos();
    }, []);

    if (loading) {
        return <div className="text-center text-white p-8">Loading your feed...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500 p-8">{error}</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold text-white mb-6">From Your Subscriptions</h1>
            {videos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {videos.map((video) => (
                        <VideoCard key={video._id} video={video} />
                    ))}
                </div>
            ) : (
                <div className="text-center text-gray-400 p-8">
                    <p>No new videos from your subscriptions.</p>
                    <p className="text-sm">Subscribe to more channels to see their latest videos here!</p>
                </div>
            )}
        </div>
    );
}

export default Dashboard;