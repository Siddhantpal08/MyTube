// src/pages/MyVideosPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import axiosClient from '../Api/axiosClient';
import VideoCard from './VideoCard';
import { Link } from 'react-router-dom';

function MyVideosPage() {
    const { user } = useAuth();
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?._id) return;
        axiosClient.get(`/videos?userId=${user._id}`)
            .then(res => setVideos(res.data.data.docs))
            .finally(() => setLoading(false));
    }, [user?._id]);

    if (loading) return <div className="p-8 text-center">Loading your videos...</div>;

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">My Videos</h1>
                <Link to="/upload-video" className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-md">
                    Upload Video
                </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {videos.length > 0 ? (
                    videos.map(video => <VideoCard key={video._id} video={video} />)
                ) : (
                    <p className="col-span-full text-center text-gray-400">You haven't uploaded any videos yet.</p>
                )}
            </div>
        </div>
    );
}

export default MyVideosPage;