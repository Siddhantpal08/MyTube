import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axiosClient from '../Api/axiosClient';
import VideoCard from './VideoCard';
import SkeletonCard from './SkeletonCard';
import { useApp } from '../Context/AppContext';

const QuotaBanner = () => (
    <div className="border-l-4 p-4 mb-6 rounded-r-lg shadow-lg bg-red-100 dark:bg-red-900 border-red-500 text-red-800 dark:text-red-100" role="alert">
        <p className="font-bold">API Limit Reached</p>
        <p className="text-sm">The daily YouTube API quota has been exceeded for this category. Please try again tomorrow.</p>
    </div>
);

function CategoryPage() {
    const { categoryName } = useParams();
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { youtubeQuotaExhausted, setYoutubeQuotaExhausted } = useApp();

    useEffect(() => {
        const fetchCategoryVideos = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axiosClient.get(`/youtube/search?query=${encodeURIComponent(categoryName)}`);
                setVideos(response.data?.data?.videos || []);
            } catch (err) {
                if (err.response && err.response.status === 429) {
                    setYoutubeQuotaExhausted(true);
                } else {
                    setError("Failed to load content.");
                }
                console.error(`Failed to fetch videos for ${categoryName}:`, err);
            } finally {
                setLoading(false);
            }
        };

        fetchCategoryVideos();
    }, [categoryName]);

    if (loading) {
        return (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
        );
    }
    
    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{categoryName}</h1>
            {youtubeQuotaExhausted && <QuotaBanner />}
            {error && <div className="text-center text-red-500 p-8 text-lg">{error}</div>}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
                {videos.map((video) => (
                    <VideoCard key={video.videoId} video={video} />
                ))}
            </div>
        </div>
    );
}

export default CategoryPage;