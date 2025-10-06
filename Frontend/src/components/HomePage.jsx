import React, { useEffect, useRef, useCallback } from 'react';
import useYouTubeInfiniteScroll from './UseYoutubeInfiniteScroll.jsx';
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

    if (videos.length === 0 && loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
        );
    }

    return (
        <div>
            {youtubeQuotaExhausted && <QuotaBanner />}
            {error && !youtubeQuotaExhausted && <div className="text-center text-red-500 p-8 text-lg">{error}</div>}
            
            {/* --- THE FINAL RESPONSIVE GRID (CAPPED AT 4 COLUMNS) --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                {videos.map((video, index) => {
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
                <div className="text-center text-white py-8 col-span-full">
                    <p>Loading more...</p>
                </div>
            )}
            
            {!hasMore && videos.length > 0 && (
                <div className="text-center text-gray-500 py-8 col-span-full">
                    <p>You've reached the end.</p>
                </div>
            )}
        </div>
    );
}

export default HomePage;