import React, { useState, useEffect } from 'react';
import axiosClient from '../Api/axiosClient';
import VideoCard from '../components/VideoCard';
import SkeletonCard from '../components/SkeletonCard';
import { Link } from 'react-router-dom';

function ExplorePage() {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAllVideos = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axiosClient.get('/videos');
                setVideos(response.data?.data?.docs || []);
            } catch (err) {
                console.error("Failed to fetch videos:", err);
                setError("Could not load videos. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchAllVideos();
    }, []);

    if (loading) {
        return (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
        );
    }

    if (error) {
        return <div className="text-center text-red-500 p-8 text-lg">{error}</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold mb-6 border-b pb-3 border-gray-200 dark:border-gray-700">
                Explore All Videos
            </h1>
            {videos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
                    {videos.map((video) => (
                        <VideoCard key={video._id} video={video} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                    <h2 className="text-xl font-semibold">No Videos Yet</h2>
                    <p className="mt-2 text-sm">Be the first one to upload a video!</p>
                    <Link to="/upload-video" className="mt-4 inline-block bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700">
                        Upload Video
                    </Link>
                </div>
            )}
        </div>
    );
}

export default ExplorePage;