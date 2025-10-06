import { useState, useEffect, useCallback } from 'react';
import axiosClient from '../Api/axiosClient';

const useInfiniteScroll = (url) => {
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);

    const fetchMore = useCallback(async () => {
        // Prevent fetching if there's no more data or if a fetch is already in progress
        if (!hasMore || loading) return;
        setLoading(true);
        setError(null);
        try {
            // Fetch the next page of data from your backend
            const response = await axiosClient.get(`${url}?page=${page}&limit=12`);
            const data = response.data.data;
            
            // Append new items to the existing list
            setItems(prev => [...prev, ...data.docs]);
            setHasMore(data.hasNextPage);
            setPage(prev => prev + 1); // Increment page for the next fetch
        } catch (err) {
            console.error("Failed to fetch more items:", err);
            setError("Could not load more content.");
        } finally {
            setLoading(false);
        }
    }, [url, page, hasMore, loading]);

    // This effect runs only once to fetch the initial set of data
    useEffect(() => {
        const fetchInitial = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axiosClient.get(`${url}?page=1&limit=12`);
                const data = response.data.data;
                setItems(data.docs);
                setHasMore(data.hasNextPage);
                setPage(2); // Set the next page to be fetched to 2
            } catch (err) {
                console.error("Failed to fetch initial items:", err);
                setError("Failed to load content.");
            } finally {
                setLoading(false);
            }
        };
        fetchInitial();
    }, [url]); // It only refetches if the base URL changes

    return { items, loading, hasMore, error, fetchMore };
};

export default useInfiniteScroll;
