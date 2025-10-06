import React, { useEffect, useRef, useCallback } from 'react';
import useYouTubeInfiniteScroll from '../hooks/useYouTubeInfiniteScroll.js';
import VideoCard from './VideoCard';
import SkeletonCard from './SkeletonCard';
import { useApp } from '../Context/AppContext';

const QuotaBanner = () => (
    <div className="bg-red-900 border-l-4 border-red-500 text-red-100 p-4 mb-6 rounded-r-lg shadow-lg" role="alert">
        <p className="font-bold">API Limit Reached</p>
        <p className="text-sm">The daily YouTube API quota has been exceeded. Public video data will not be available until tomorrow.</p>
    </div>
);

function HomePage() {
    // Use the new hook to get a general feed of trending videos
    const { videos, loading, hasMore, error, fetchMoreVideos } = useYouTubeInfiniteScroll('latest trending videos');
    const { youtubeQuotaExhausted } = useApp();
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

    // Show skeletons only on the very first page load
    if (videos.length === 0 && loading) {
        return (
            <div className="p-4">
                <div className="h-8 w-1/4 bg-gray-700 rounded animate-pulse mb-6"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
                    {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold text-white mb-6">Home Feed</h1>
            
            {youtubeQuotaExhausted && <QuotaBanner />}
            {error && <div className="text-center text-red-500 p-8 text-lg">{error}</div>}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
                {videos.map((video, index) => {
                    // Attach the ref to the last video in the list to trigger the next fetch
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

            {loading && videos.length > 0 && (
                <div className="text-center text-white py-8">
                    <p>Loading more...</p>
                </div>
            )}
            
            {!hasMore && videos.length > 0 && (
                <div className="text-center text-gray-500 py-8">
                    <p>You've reached the end.</p>
                </div>
            )}
        </div>
    );
}

export default HomePage;