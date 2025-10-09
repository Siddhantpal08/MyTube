import React from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../Api/axiosClient';
import { useAuth } from '../Context/AuthContext';
import toast from 'react-hot-toast';
import TweetCard from './TweetCard'; // Import the new, smart TweetCard

function CommunityPage() {
    const { isAuthenticated } = useAuth();
    const [tweets, setTweets] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [feedType, setFeedType] = React.useState(isAuthenticated ? 'subscribed' : 'global');

    const pageTitle = feedType === 'subscribed' ? "Your Feed" : "Global Community";
    const emptyMessage = feedType === 'subscribed' 
        ? "Posts from channels you subscribe to will appear here."
        : "There are no posts yet. Be the first to share something!";

    React.useEffect(() => {
        const fetchTweets = async () => {
            setLoading(true);
            setError(null);
            const endpoint = feedType === 'subscribed' ? '/tweets/feed' : '/tweets';
            
            try {
                const response = await axiosClient.get(endpoint);
                setTweets(response.data?.data?.docs || []);
            } catch (err) {
                console.error("Failed to fetch community posts:", err);
                setError("Could not load the feed. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchTweets();
    }, [feedType, isAuthenticated]);

    const handleDeleteTweet = async (tweetId) => {
        // Optimistically remove the tweet from the UI for an instant feel
        setTweets(prevTweets => prevTweets.filter(tweet => tweet._id !== tweetId));
        try {
            await axiosClient.delete(`/tweets/${tweetId}`);
            toast.success("Post deleted");
        } catch (error) {
            console.error("Failed to delete tweet:", error);
            // In a real app, you would add the tweet back to the UI on failure
            toast.error("Failed to delete post.");
        }
    };

    if (loading) return <div className="text-center text-white p-8">Loading Feed...</div>;
    if (error) return <div className="text-center text-red-500 p-8">{error}</div>;

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold text-white">{pageTitle}</h1>
                {isAuthenticated && (
                    <Link to="/add-tweet" className="bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700">
                        Add Post
                    </Link>
                )}
            </div>

            {/* --- Feed Toggle Buttons for logged-in users --- */}
            {isAuthenticated && (
                <div className="flex space-x-2 border-b border-gray-700 mb-6">
                    <button onClick={() => setFeedType('subscribed')} className={`py-2 px-4 font-semibold ${feedType === 'subscribed' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}>For You</button>
                    <button onClick={() => setFeedType('global')} className={`py-2 px-4 font-semibold ${feedType === 'global' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}>Global</button>
                </div>
            )}
            
            <div className="space-y-4">
                {tweets.length > 0 ? (
                    tweets.map((tweet) => <TweetCard key={tweet._id} tweet={tweet} onDelete={handleDeleteTweet} />)
                ) : (
                    <div className="text-center text-gray-400 py-16 bg-gray-800 rounded-lg">
                        <h2 className="text-xl font-semibold">The feed is quiet</h2>
                        <p className="mt-2 text-sm">{emptyMessage}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CommunityPage;