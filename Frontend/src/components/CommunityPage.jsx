// src/components/CommunityPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../Api/axiosClient';
import { placeholderAvatar, timeSince } from '../utils/formatters';

const TweetCard = ({ tweet }) => (
    <div className="flex items-start space-x-4 p-4 bg-gray-800 rounded-lg">
        <img src={tweet.owner?.avatar || placeholderAvatar} alt={tweet.owner?.username} className="w-12 h-12 rounded-full" />
        <div>
            <div className="flex items-center space-x-2">
                <p className="font-bold text-white">{tweet.owner?.username}</p>
                <p className="text-xs text-gray-400 font-normal">{timeSince(tweet.createdAt)}</p>
            </div>
            <p className="text-gray-300 mt-2 whitespace-pre-wrap">{tweet.content}</p>
        </div>
    </div>
);

function CommunityPage() {
    const [tweets, setTweets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        // This endpoint fetches posts from channels you're subscribed to
        axiosClient.get('/tweets/feed')
            .then(res => {
                setTweets(res.data.data || []);
            })
            .catch(err => {
                console.error("Failed to fetch tweet feed:", err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);
    
    if (loading) return <div className="p-8 text-center text-white">Loading feed...</div>;

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Community Feed</h1>
                <Link to="/add-tweet" className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-500">
                    Create Post
                </Link>
            </div>

            <div className="space-y-4">
                {tweets.length > 0 ? (
                    tweets.map(tweet => <TweetCard key={tweet._id} tweet={tweet} />)
                ) : (
                    <div className="text-center text-gray-400 p-8 bg-gray-800 rounded-lg">
                        <h3 className="text-lg font-semibold">Your feed is empty</h3>
                        <p className="mt-2">Posts from channels you subscribe to will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CommunityPage;