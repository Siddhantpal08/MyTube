import React, { useState, useEffect } from 'react';
import axiosClient from '../Api/axiosClient';
import VideoCard from './VideoCard'; // We'll create this next
import SkeletonCard from './SkeletonCard'; // We'll create this next

// A reusable component for a single row of videos
const VideoRow = ({ category, videos }) => (
    <section className="mb-10">
        <h2 className="text-2xl font-bold text-white mb-4">{category}</h2>
        <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
            {videos.map(video => (
                <VideoCard key={video.videoId} video={video} />
            ))}
        </div>
    </section>
);

function HomePage() {
    const [videoRows, setVideoRows] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const categories = [
        "Latest Movie Trailers",
        "Top Music Videos India",
        "Tech Reviews",
        "Live Gaming Streams"
    ];

    useEffect(() => {
        const fetchAllCategories = async () => {
            setLoading(true);
            setError(null);
            try {
                const requests = categories.map(category => 
                    axiosClient.get(`/youtube/search?query=${encodeURIComponent(category)}`)
                );
                
                const responses = await Promise.all(requests);
                
                const newVideoRows = {};
                responses.forEach((response, index) => {
                    newVideoRows[categories[index]] = response.data?.data?.videos || [];
                });
                
                setVideoRows(newVideoRows);
            } catch (err) {
                console.error("Failed to fetch videos:", err);
                setError("Failed to load content. Please check your connection and try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchAllCategories();
    }, []);

    if (loading) {
        return (
            <div>
                {categories.map(category => (
                    <div key={category} className="mb-10">
                        <div className="h-8 w-1/3 bg-gray-700 rounded animate-pulse mb-4"></div>
                        <div className="flex space-x-4">
                            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                    </div>
                ))}
            </div>
        );
    }
    
    if (error) {
        return <div className="text-center text-red-500 p-8 text-lg">{error}</div>;
    }

    return (
        <div className="py-6">
            {Object.entries(videoRows).map(([category, videos]) => (
                videos.length > 0 && <VideoRow key={category} category={category} videos={videos} />
            ))}
        </div>
    );
}

export default HomePage;

