import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axiosClient from '../Api/axiosClient'; 
import { useAuth } from '../Context/AuthContext';
import toast from 'react-hot-toast';
import TweetCard from '../components/TweetCard'; 

function CommunityPage() {
    const location = useLocation(); 
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    
    // --- STATE MANAGEMENT ---
    const [tweets, setTweets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [feedType, setFeedType] = useState(isAuthenticated ? 'subscribed' : 'global');
    
    // --- NEW: State for pagination ---
    const [page, setPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    // --- EFFECTS ---

    // Effect to reset the feed when the user logs in/out or switches tabs
    useEffect(() => {
        setFeedType(isAuthenticated ? 'subscribed' : 'global');
        setTweets([]); // Clear old tweets
        setPage(1); // Reset to page 1
        setHasNextPage(false);
    }, [isAuthenticated]);

    // Effect to fetch tweets when the feed type changes
    useEffect(() => {
        const fetchFirstPage = async () => {
            setLoading(true);
            setError(null);
            const endpoint = `${(feedType === 'subscribed' && isAuthenticated) ? '/tweets/feed' : '/tweets'}?page=1`;
            
            try {
                const response = await axiosClient.get(endpoint);
                const data = response.data?.data;
                setTweets(data?.docs || []);
                setHasNextPage(data?.hasNextPage || false);
                setPage(1); // Explicitly set page to 1
            } catch (err) {
                console.error("Failed to fetch community posts:", err);
                setError("Could not load the feed. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchFirstPage();
    }, [feedType, isAuthenticated]);
    
    // Effect for the optimistic update when a new tweet is created
    useEffect(() => {
        if (location.state?.newTweet) {
            setTweets(prevTweets => [location.state.newTweet, ...prevTweets]);
            navigate(location.pathname, { replace: true, state: null });
        }
    }, [location.state, navigate]);
    
    // --- HANDLER FUNCTIONS ---

    // NEW: Handler for the "Load More" button
    const handleLoadMore = async () => {
        if (loadingMore || !hasNextPage) return;

        setLoadingMore(true);
        const endpoint = `${(feedType === 'subscribed' && isAuthenticated) ? '/tweets/feed' : '/tweets'}?page=${page + 1}`;

        try {
            const response = await axiosClient.get(endpoint);
            const data = response.data?.data;
            // Append new tweets to the existing list
            setTweets(prev => [...prev, ...(data?.docs || [])]);
            setHasNextPage(data?.hasNextPage || false);
            setPage(data?.page || page + 1);
        } catch (err) {
            toast.error("Failed to load more posts.");
        } finally {
            setLoadingMore(false);
        }
    };

    const handleDeleteTweet = async (tweetId) => {
        // ... (Your existing delete handler is correct)
    };

    const pageTitle = feedType === 'subscribed' ? "Your Feed" : "Global Community";
    const emptyMessage = feedType === 'subscribed' 
        ? "Posts from channels you subscribe to (and your own posts) will appear here."
        : "There are no posts yet. Be the first to share something!";

    if (loading) return <div className="text-center p-8 text-lg font-medium text-gray-700 dark:text-gray-300">Loading Feed...</div>;
    if (error) return <div className="text-center text-red-500 p-8 bg-red-50 dark:bg-red-900/20 rounded-lg max-w-lg mx-auto mt-6">{error}</div>;

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-0">
            {/* ... (Your existing JSX for the header and tabs is correct) ... */}
            
            <div className="space-y-4">
                {tweets.length > 0 ? (
                    tweets.map((tweet) => <TweetCard key={tweet._id} tweet={tweet} onDelete={handleDeleteTweet} />)
                ) : (
                    <div className="text-center py-16 rounded-lg bg-gray-100 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">The feed is quiet</h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{emptyMessage}</p>
                    </div>
                )}
            </div>

            {/* --- NEW: Load More Button and Loading Indicator --- */}
            <div className="text-center py-8">
                {hasNextPage && (
                    <button 
                        onClick={handleLoadMore} 
                        disabled={loadingMore}
                        className="bg-red-600 text-white font-bold py-2 px-6 rounded-md shadow-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                        {loadingMore ? 'Loading...' : 'Load More'}
                    </button>
                )}
                {!hasNextPage && tweets.length > 0 && (
                    <p className="text-gray-500 dark:text-gray-400">You've reached the end of the feed.</p>
                )}
            </div>
        </div>
    );
}

export default CommunityPage;