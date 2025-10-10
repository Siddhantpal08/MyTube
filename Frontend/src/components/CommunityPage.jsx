import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axiosClient from '../Api/axiosClient'; 
import { useAuth } from '../Context/AuthContext';
import toast from 'react-hot-toast';
import TweetCard from '../components/TweetCard'; 

function CommunityPage() {
    const location = useLocation(); 
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    
    // --- Pagination and Feed State ---
    const [tweets, setTweets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [feedType, setFeedType] = useState(isAuthenticated ? 'subscribed' : 'global');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    // Ref for the scroll observer element
    const observer = useRef();
    // Ref to the last tweet element to attach the observer
    const lastTweetElementRef = useCallback(node => {
        if (loading || loadingMore || !hasMore) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                setPage(prevPage => prevPage + 1);
            }
        }, { threshold: 1.0 });

        if (node) observer.current.observe(node);
    }, [loading, loadingMore, hasMore]);


    // --- Core Fetching Logic (Initial Load and Tab Change) ---
    const fetchTweets = useCallback(async (resetPage = false) => {
        const fetchPage = resetPage ? 1 : page;
        
        // If we are resetting, show full loading state
        if (resetPage) {
             setLoading(true);
             setTweets([]); // Clear tweets on tab/feed type change
        } else {
             setLoadingMore(true);
        }

        setError(null);
        
        // Endpoint adjusted for the new controller name and pagination
        const endpoint = (feedType === 'subscribed' && isAuthenticated) 
            ? `/tweets/feed?page=${fetchPage}` 
            : `/tweets?page=${fetchPage}`;
        
        try {
            const response = await axiosClient.get(endpoint);
            const data = response.data?.data;

            if (resetPage) {
                 setTweets(data?.docs || []);
            } else {
                 setTweets(prevTweets => [...prevTweets, ...(data?.docs || [])]);
            }
            
            // Update pagination state
            setPage(data?.page || 1);
            setHasMore(data?.hasNextPage || false);
            
        } catch (err) {
            console.error("Failed to fetch community posts:", err);
            // If fetching subscribed feed fails (e.g., due to auth), switch to global and retry only if on page 1
            if (feedType === 'subscribed' && err.response?.status === 401 && fetchPage === 1) {
                 toast.error("Authentication required for 'For You' feed. Switching to Global.");
                 setFeedType('global'); // This will trigger a new fetchTweets call via dependency array
            } else {
                 setError("Could not load the feed. Please try again later.");
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [feedType, isAuthenticated, page]);

    // --- EFFECT #1: Initial Load, Tab Change, and Refresh ---
    // Runs when feedType or isAuthenticated changes, always resetting to page 1
    useEffect(() => {
        fetchTweets(true); // Always reset when feedType/auth changes
    }, [feedType, isAuthenticated]); // Note: Removed fetchTweets dependency to prevent infinite loop

    // --- EFFECT #2: Load More Data (Triggered by intersection observer calling setPage) ---
    useEffect(() => {
        if (page > 1) {
            fetchTweets(false); // Do not reset, just append
        }
    }, [page]); // Runs only when 'page' increases

    // --- EFFECT #3: Optimistic Update from AddTweetPage ---
    // Uses navigation state to inject a newly created tweet at the top
    useEffect(() => {
        if (location.state?.newTweet) {
            // Add the new tweet to the top of the current list
            setTweets(prevTweets => [location.state.newTweet, ...prevTweets]);
            // Clear the location state to prevent this from running again on refresh
            navigate(location.pathname, { replace: true, state: null });
        }
    }, [location.state, navigate, location.pathname]);


    // --- Delete Handler ---
    const handleDeleteTweet = async (tweetId) => {
        // Optimistically remove the tweet from the UI
        const originalTweets = tweets;
        setTweets(prevTweets => prevTweets.filter(tweet => tweet._id !== tweetId));
        
        try {
            await axiosClient.delete(`/tweets/${tweetId}`);
            toast.success("Post deleted");
        } catch (error) {
            console.error("Failed to delete tweet:", error);
            toast.error("Failed to delete post.");
            // Revert on failure
            setTweets(originalTweets);
        }
    };

    const pageTitle = feedType === 'subscribed' ? "Your Feed" : "Global Community";
    const emptyMessage = feedType === 'subscribed' 
        ? "Posts from channels you subscribe to will appear here. (Remember: Your own posts should now show up here too!)"
        : "There are no posts yet. Be the first to share something!";

    if (loading) return <div className="text-center p-8 text-lg font-medium text-gray-700 dark:text-gray-300">Loading Feed...</div>;
    if (error) return <div className="text-center text-red-500 p-8 bg-red-50 dark:bg-red-900 rounded-lg max-w-lg mx-auto mt-6">{error}</div>;

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-0">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{pageTitle}</h1>
                {isAuthenticated && (
                    <Link to="/add-tweet" className="bg-red-600 text-white font-bold py-2 px-4 rounded-md shadow-lg hover:bg-red-700 transition-colors">
                        Add Post
                    </Link>
                )}
            </div>

            {/* --- Feed Toggle Buttons --- */}
            {isAuthenticated && (
                <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700 mb-6">
                    <button 
                        onClick={() => setFeedType('subscribed')} 
                        className={`py-2 px-1 font-semibold transition-colors ${feedType === 'subscribed' ? 'text-red-600 dark:text-white border-b-2 border-red-600 dark:border-white' : 'text-gray-500 dark:text-gray-400 hover:text-red-500'}`}
                    >
                        For You
                    </button>
                    <button 
                        onClick={() => setFeedType('global')} 
                        className={`py-2 px-1 font-semibold transition-colors ${feedType === 'global' ? 'text-red-600 dark:text-white border-b-2 border-red-600 dark:border-white' : 'text-gray-500 dark:text-gray-400 hover:text-red-500'}`}
                    >
                        Global
                    </button>
                </div>
            )}
            
            <div className="space-y-4">
                {tweets.length > 0 ? (
                    tweets.map((tweet, index) => {
                        // Attach ref to the last element to trigger the next page load
                        if (tweets.length === index + 1) {
                            return (
                                <div ref={lastTweetElementRef} key={tweet._id}>
                                    <TweetCard tweet={tweet} onDelete={handleDeleteTweet} />
                                </div>
                            );
                        }
                        return <TweetCard key={tweet._id} tweet={tweet} onDelete={handleDeleteTweet} />;
                    })
                ) : (
                    <div className="text-center py-16 rounded-lg bg-gray-100 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">The feed is quiet</h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{emptyMessage}</p>
                    </div>
                )}
                
                {/* Loading indicator for infinite scroll */}
                {loadingMore && (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">Loading more posts...</div>
                )}

                {/* End of results message */}
                {!hasMore && tweets.length > 0 && !loadingMore && (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">You've reached the end of the feed.</div>
                )}
            </div>
        </div>
    );
}

export default CommunityPage;
