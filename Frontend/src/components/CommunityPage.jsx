import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../Api/axiosClient';
import { useAuth } from '../Context/AuthContext';
import { timeSince, placeholderAvatar } from '../utils/formatters';

// A reusable component for a single tweet/post card
const TweetCard = ({ tweet }) => (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex items-start space-x-4">
        <Link to={`/channel/${tweet.owner?.username}`}>
            <img src={tweet.owner?.avatar || placeholderAvatar} alt={tweet.owner?.username} className="w-12 h-12 rounded-full" />
        </Link>
        <div>
            <div className="flex items-center space-x-2">
                <Link to={`/channel/${tweet.owner?.username}`} className="font-bold text-white hover:underline">
                    {tweet.owner?.fullName}
                </Link>
                <span className="text-gray-400 text-sm">@{tweet.owner?.username}</span>
                <span className="text-gray-500 text-sm">· {timeSince(tweet.createdAt)}</span>
            </div>
            <p className="text-gray-300 mt-1 whitespace-pre-wrap">{tweet.content}</p>
        </div>
    </div>
);

function CommunityPage() {
    const { isAuthenticated } = useAuth();
    const [tweets, setTweets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // This logic determines the title and what to show when the feed is empty
    const pageTitle = isAuthenticated ? "Your Feed" : "Community";
    const emptyMessage = isAuthenticated 
        ? "Posts from channels you subscribe to will appear here."
        : "There are no posts yet. Login to see a personalized feed!";

    useEffect(() => {
        const fetchTweets = async () => {
            setLoading(true);
            setError(null);
            
            // If the user is logged in, fetch their personalized feed. Otherwise, fetch the public feed.
            const endpoint = isAuthenticated ? '/tweets/feed' : '/tweets';
            
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
    }, [isAuthenticated]); // Re-fetch the feed if the user's login status changes

    if (loading) {
        return <div className="text-center text-white p-8">Loading Feed...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500 p-8">{error}</div>;
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">{pageTitle}</h1>
                {isAuthenticated && (
                    <Link to="/add-tweet" className="bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700 transition-colors">
                        Add Post
                    </Link>
                )}
            </div>
            
            <div className="space-y-4">
                {tweets.length > 0 ? (
                    tweets.map((tweet) => <TweetCard key={tweet._id} tweet={tweet} />)
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