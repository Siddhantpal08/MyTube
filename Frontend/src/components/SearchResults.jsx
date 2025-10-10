import React, { useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import SkeletonCard from '../components/SkeletonCard';
import useYouTubeInfiniteScroll from '../hooks/useYouTubeInfiniteScroll'; // Assuming the hook is in a 'hooks' folder

function SearchResults() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('search_query');

    // --- THIS IS THE FIX ---
    // Use your custom hook to manage fetching, state, and pagination.
    const { videos, loading, hasMore, error, fetchMoreVideos } = useYouTubeInfiniteScroll(query);

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

    // Initial loading state with skeletons
    if (videos.length === 0 && loading) {
        return (
            <div className="p-4">
                <div className="h-8 w-1/2 rounded animate-pulse mb-6 bg-gray-200 dark:bg-gray-700"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            </div>
        );
    }

    if (error) return <div className="text-center text-red-500 p-8 text-lg">{error}</div>;

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6 border-b pb-3 border-gray-200 dark:border-gray-700">
                Results for: <span className="font-normal italic">"{query}"</span>
            </h1>
            {videos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
                    {videos.map((video, index) => {
                        // Attach the ref to the last video element in the list
                        if (videos.length === index + 1) {
                            return (
                                <div ref={lastVideoElementRef} key={video.videoId || video._id}>
                                    <VideoCard video={video} />
                                </div>
                            );
                        } else {
                            return <VideoCard key={video.videoId || video._id} video={video} />;
                        }
                    })}
                </div>
            ) : (
                <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                    <h2 className="text-xl font-semibold">No results found for "{query}"</h2>
                    <p className="mt-2 text-sm">Try a different search term.</p>
                </div>
            )}

            {/* Loading indicator for when fetching more videos */}
            {loading && videos.length > 0 && (
                <div className="text-center py-8 col-span-full text-gray-800 dark:text-white">
                    <p>Loading more results...</p>
                </div>
            )}
            
            {/* End of results message */}
            {!hasMore && videos.length > 0 && (
                <div className="text-center text-gray-500 py-8 col-span-full">
                    <p>You've reached the end of the search results.</p>
                </div>
            )}
        </div>
    );
}

export default SearchResults;