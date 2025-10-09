import React from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../Api/axiosClient'; 
import { useAuth } from '../Context/AuthContext';
import toast from 'react-hot-toast';
import TweetCard from '../components/TweetCard'; 

function CommunityPage() {
    const { isAuthenticated, user } = useAuth();
    const [tweets, setTweets] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    
    // Initialize to 'subscribed' only if authenticated, otherwise default to 'global'
    const initialFeedType = isAuthenticated ? 'subscribed' : 'global';
    const [feedType, setFeedType] = React.useState(initialFeedType);

    // Ensure feedType resets if authentication status changes (e.g., login/logout)
    React.useEffect(() => {
        setFeedType(isAuthenticated ? 'subscribed' : 'global');
    }, [isAuthenticated]);


    const pageTitle = feedType === 'subscribed' ? "Your Feed" : "Global Community";
    const emptyMessage = feedType === 'subscribed' 
        ? "Posts from channels you subscribe to will appear here. (Remember: Your own posts should now show up here too!)"
        : "There are no posts yet. Be the first to share something!";

    React.useEffect(() => {
        const fetchTweets = async () => {
            setLoading(true);
            setError(null);
            // If the user is logged out, always default to the global endpoint
            const endpoint = (feedType === 'subscribed' && isAuthenticated) ? '/tweets/feed' : '/tweets';
            
            try {
                const response = await axiosClient.get(endpoint);
                setTweets(response.data?.data?.docs || []);
            } catch (err) {
                console.error("Failed to fetch community posts:", err);
                // If fetching subscribed feed fails (e.g., due to auth), try switching to global
                if (feedType === 'subscribed' && err.response?.status === 401) {
                    toast.error("Authentication required for 'For You' feed.");
                    setFeedType('global'); 
                } else {
                    setError("Could not load the feed. Please try again later.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchTweets();
    }, [feedType, isAuthenticated]);

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
            {/* Show toggle only if authenticated */}
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
                    tweets.map((tweet) => <TweetCard key={tweet._id} tweet={tweet} onDelete={handleDeleteTweet} />)
                ) : (
                    <div className="text-center py-16 rounded-lg bg-gray-100 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">The feed is quiet</h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{emptyMessage}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CommunityPage;
