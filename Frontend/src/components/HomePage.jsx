import React, { useState, useEffect } from 'react';
import axiosClient from '../Api/axiosClient';
import { Link } from 'react-router-dom';

// --- Reusable Video Card Component ---
// Placed here for simplicity, you can move it to its own file if you prefer.
const VideoCard = ({ video }) => (
    <Link to={`/watch/${video.videoId}`} className="w-72 flex-shrink-0 group">
        <div className="w-full aspect-video rounded-xl overflow-hidden">
            <img 
                src={video.thumbnail} 
                alt={video.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
            />
        </div>
        <div className="mt-2">
            <h3 className="text-white font-semibold text-md truncate" title={video.title}>
                {video.title}
            </h3>
            <p className="text-gray-400 text-sm mt-1">{video.channelTitle}</p>
        </div>
    </Link>
);

// --- Reusable Skeleton Loader Component ---
const SkeletonCard = () => (
    <div className="w-72 flex-shrink-0 animate-pulse">
        <div className="w-full aspect-video bg-gray-700 rounded-xl"></div>
        <div className="mt-2">
            <div className="h-5 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2 mt-2"></div>
        </div>
    </div>
);

// --- A Row for a Single Category ---
const VideoRow = ({ category, videos }) => (
    <section className="mb-10">
        <h2 className="text-2xl font-bold text-white mb-4 px-4 md:px-0">{category}</h2>
        <div className="flex space-x-4 overflow-x-auto pb-4 px-4 md:px-0 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
            {videos.map(video => (
                <VideoCard key={video.videoId} video={video} />
            ))}
        </div>
    </section>
);

// --- Main HomePage Component ---
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
                    // This is the key fix: correctly accessing the 'videos' array from your backend's ApiResponse structure.
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
            <div className="p-4">
                {categories.map(category => (
                    <div key={category} className="mb-10">
                        <div className="h-8 w-1/3 bg-gray-700 rounded animate-pulse mb-4 px-4 md:px-0"></div>
                        <div className="flex space-x-4 px-4 md:px-0">
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
