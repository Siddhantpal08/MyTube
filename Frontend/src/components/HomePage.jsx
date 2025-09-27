import React, { useState, useEffect } from 'react';
import axiosClient from '../Api/axiosClient';
import VideoCard from './VideoCard';
import SkeletonCard from './SkeletonCard';

// A reusable component for a single, horizontally scrolling row of videos
const VideoRow = ({ category, videos }) => (
    <section className="mb-10">
        <h2 className="text-2xl font-bold text-white mb-4">{category}</h2>
        <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
            {videos.map(video => (
                <VideoCard key={video.videoId || video._id} video={video} />
            ))}
        </div>
    </section>
);

// The main HomePage component
function HomePage() {
    const [videoRows, setVideoRows] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Define the categories you want to display on the homepage
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
                // Create an array of API requests for each category
                const requests = categories.map(category => 
                    axiosClient.get(`/youtube/search?query=${encodeURIComponent(category)}`)
                );
                
                // Fetch all categories in parallel for faster loading
                const responses = await Promise.all(requests);
                
                const newVideoRows = {};
                responses.forEach((response, index) => {
                    // Extract the video array from your backend's ApiResponse structure
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
    }, []); // The empty dependency array ensures this runs only once when the component mounts

    // Display skeleton loaders while the data is being fetched
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
    
    // Display an error message if the fetch fails
    if (error) {
        return <div className="text-center text-red-500 p-8 text-lg">{error}</div>;
    }

    // Render the rows of videos once the data is available
    return (
        <div className="py-6">
            {Object.entries(videoRows).map(([category, videos]) => (
                // Only render a row if it has videos
                videos.length > 0 && <VideoRow key={category} category={category} videos={videos} />
            ))}
        </div>
    );
}

export default HomePage;