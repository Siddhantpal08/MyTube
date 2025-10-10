import React, { useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import VideoCard from './VideoCard';
import SkeletonCard from './SkeletonCard';
import { useApp } from '../Context/AppContext';
import useYouTubeInfiniteScroll from './UseYoutubeInfiniteScroll'; // Import the custom hook

const QuotaBanner = () => (
    <div className="border-l-4 p-4 mb-6 rounded-r-lg shadow-lg bg-red-100 dark:bg-red-900 border-red-500 text-red-800 dark:text-red-100" role="alert">
        <p className="font-bold">API Limit Reached</p>
        <p className="text-sm">The daily YouTube API quota has been exceeded for this category. Please try again tomorrow.</p>
    </div>
);

function CategoryPage() {
    const { categoryName } = useParams();
    const { youtubeQuotaExhausted } = useApp();
    
    // --- THIS IS THE FIX ---
    // Use your custom hook to handle all the fetching, state, and pagination logic.
    const { videos, loading, hasMore, error, fetchMoreVideos } = useYouTubeInfiniteScroll(categoryName);
    
    // Logic for the IntersectionObserver to detect when to load more videos
    const observer = useRef();
    const lastVideoElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                fetchMoreVideos();
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore, fetchMoreVideos]);


    // Initial loading state (shows skeletons)
    if (videos.length === 0 && loading) {
        return (
            <div className="p-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{categoryName}</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            </div>
        );
    }
    
    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{categoryName}</h1>
            {youtubeQuotaExhausted && <QuotaBanner />}
            {error && !youtubeQuotaExhausted && <div className="text-center text-red-500 p-8 text-lg">{error}</div>}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
                {videos.map((video, index) => {
                    // If this is the last video, attach the ref to it
                    if (videos.length === index + 1) {
                        return (
                            <div ref={lastVideoElementRef} key={video.videoId}>
                                <VideoCard video={video} />
                            </div>
                        );
                    } else {
                        return <VideoCard key={video.videoId} video={video} />;
                    }
                })}
            </div>

            {/* Show "Loading more..." text at the bottom while fetching */}
            {loading && videos.length > 0 && (
                <div className="text-center py-8 col-span-full text-gray-800 dark:text-white">
                    <p>Loading more...</p>
                </div>
            )}
            
            {/* Show "End of results" message when there are no more pages */}
            {!hasMore && videos.length > 0 && (
                <div className="text-center text-gray-500 py-8 col-span-full">
                    <p>You've reached the end.</p>
                </div>
            )}
        </div>
    );
}

export default CategoryPage;