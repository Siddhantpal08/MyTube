import React, { useState, useEffect } from 'react';
import axiosClient from '../Api/axiosClient';
import VideoCard from './VideoCard';
import SkeletonCard from './SkeletonCard';
import InfiniteScroll from 'react-infinite-scroll-component';

function HomePage() {
    const [videos, setVideos] = useState([]);
    const [pageToken, setPageToken] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState(null);

    const fetchInitialVideos = async () => {
        try {
            const response = await axiosClient.get('/youtube/search?query=latest+trailers');
            
            // --- DEBUGGING STEP ---
            // 1. Open your browser console.
            // 2. Look for "HOMEPAGE API RESPONSE" and expand the object to see its structure.
            console.log("HOMEPAGE API RESPONSE:", response.data);
            
            // 3. Adjust the line below to match the path to your array of videos.
            // Based on our backend, it should be `response.data.data.videos`.
            setVideos(response.data.data.videos || []);
            setPageToken(response.data.data.nextPageToken);
            setHasMore(!!response.data.data.nextPageToken);
            
        } catch (err) {
            setError("Failed to fetch videos. Check your backend API key and quota.");
            console.error(err);
        }
    };

    const fetchMoreVideos = async () => {
        if (!pageToken) {
            setHasMore(false);
            return;
        }
        try {
            const response = await axiosClient.get(`/youtube/search?query=latest+trailers&pageToken=${pageToken}`);
            const newVideos = response.data.data.videos || [];
            
            setVideos(prevVideos => {
                const existingIds = new Set(prevVideos.map(v => v.videoId));
                const uniqueNewVideos = newVideos.filter(v => !existingIds.has(v.videoId));
                return [...prevVideos, ...uniqueNewVideos];
            });
    
            const newPageToken = response.data.data.nextPageToken;
            setPageToken(newPageToken);
            setHasMore(!!newPageToken);
        } catch (err) {
            setError("Failed to fetch more videos.");
        }
    };

    useEffect(() => {
        fetchInitialVideos();
    }, []);

    if (error) return <div className="text-center text-red-500 p-8">{error}</div>;

    if (videos.length === 0 && hasMore) {
        return (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
        );
    }
    
    return (
        <InfiniteScroll
            dataLength={videos.length}
            next={fetchMoreVideos}
            hasMore={hasMore}
            loader={
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-4">
                    {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            }
            endMessage={<p className="text-center text-gray-500 my-8"><b>You've seen it all!</b></p>}
        >
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {videos.map((video) => (
                    <VideoCard key={video.videoId} video={video} />
                ))}
            </div>
        </InfiniteScroll>
    );
}

export default HomePage;