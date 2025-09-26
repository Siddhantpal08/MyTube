// src/components/HomePage.jsx
import React, { useState, useEffect } from 'react';
import axiosClient from '../Api/axiosClient';
import VideoCard from './VideoCard';
import SkeletonCard from './SkeletonCard';

// Define the categories you want to show on the homepage
const categories = [
    "Latest Movie Trailers",
    "Top Music Videos India",
    "Tech Reviews",
    "Live Gaming Streams"
];

// A new component for a single row of videos
const VideoRow = ({ category, videos }) => (
    <section className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">{category}</h2>
        <div className="flex space-x-4 overflow-x-auto pb-4">
            {videos.map(video => (
                <div key={video.videoId} className="w-72 flex-shrink-0">
                    <VideoCard video={video} />
                </div>
            ))}
        </div>
    </section>
);

function HomePage() {
    const [videoRows, setVideoRows] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAllCategories = async () => {
            setLoading(true);
            try {
                // Fetch all categories in parallel
                const responses = await Promise.all(
                    categories.map(category => 
                        axiosClient.get(`/youtube/search?query=${encodeURIComponent(category)}`)
                    )
                );
                
                const newVideoRows = {};
                responses.forEach((response, index) => {
                    newVideoRows[categories[index]] = response.data.data.items || [];
                });
                
                setVideoRows(newVideoRows);
            } catch (err) {
                setError("Failed to fetch videos. Check your backend API key and quota.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllCategories();
    }, []);

    if (loading) {
        return (
            <div className="p-4">
                {categories.map(category => (
                    <div key={category} className="mb-8">
                        <div className="h-8 w-1/3 bg-gray-700 rounded animate-pulse mb-4"></div>
                        <div className="flex space-x-4">
                            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="w-72 flex-shrink-0"><SkeletonCard /></div>)}
                        </div>
                    </div>
                ))}
            </div>
        );
    }
    
    if (error) return <div className="text-center text-red-500 p-8">{error}</div>;

    return (
        <div className="p-4">
            {Object.entries(videoRows).map(([category, videos]) => (
                <VideoRow key={category} category={category} videos={videos} />
            ))}
        </div>
    );
}

export default HomePage;