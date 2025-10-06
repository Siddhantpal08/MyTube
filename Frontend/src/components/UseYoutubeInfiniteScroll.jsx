import { useState, useEffect, useCallback } from 'react';
import axiosClient from '../Api/axiosClient';
import { useApp } from '../Context/AppContext';

const useYouTubeInfiniteScroll = (query) => {
    const [videos, setVideos] = useState([]);
    const [nextPageToken, setNextPageToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { setYoutubeQuotaExhausted } = useApp();

    const fetchMoreVideos = useCallback(async () => {
        if (loading) return;
        setLoading(true);
        setError(null);
        
        let url = `/youtube/search?query=${encodeURIComponent(query)}`;
        if (nextPageToken) {
            url += `&pageToken=${nextPageToken}`;
        }

        try {
            const response = await axiosClient.get(url);
            const data = response.data.data;

            // Append new videos and prevent duplicates
            setVideos(prev => {
                const existingIds = new Set(prev.map(v => v.videoId));
                const newVideos = data.videos.filter(v => !existingIds.has(v.videoId));
                return [...prev, ...newVideos];
            });
            
            setNextPageToken(data.nextPageToken || null);
        } catch (err) {
            if (err.response && err.response.status === 429) {
                setYoutubeQuotaExhausted(true);
            } else {
                setError("Failed to load content.");
            }
            console.error("Failed to fetch YouTube videos:", err);
        } finally {
            setLoading(false);
        }
    }, [query, nextPageToken, loading, setYoutubeQuotaExhausted]);

    // This effect runs only once to fetch the initial set of videos
    useEffect(() => {
        const fetchInitial = async () => {
            setLoading(true);
            try {
                const response = await axiosClient.get(`/youtube/search?query=${encodeURIComponent(query)}`);
                const data = response.data.data;
                setVideos(data.videos || []);
                setNextPageToken(data.nextPageToken || null);
            } catch (err) {
                 if (err.response && err.response.status === 429) {
                    setYoutubeQuotaExhausted(true);
                } else {
                    setError("Failed to load content.");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchInitial();
    }, [query, setYoutubeQuotaExhausted]); // Reruns only if the base query changes

    return { videos, loading, hasMore: !!nextPageToken, error, fetchMoreVideos };
};

export default useYouTubeInfiniteScroll;