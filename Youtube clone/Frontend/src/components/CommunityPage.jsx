// src/components/CommunityPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import CreateTweet from './CreateTweet';
import TweetList from './TweetList';

function CommunityPage() {
    // Assuming the URL will be like /channel/:userId/community
    const { userId } = useParams(); 
    const { user } = useAuth();

    const [tweets, setTweets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const isChannelOwner = user?._id === userId;

    useEffect(() => {
        const fetchTweets = async () => {
            try {
                setLoading(true);
                // Assuming an endpoint to get all tweets by a user
                const response = await axiosClient.get(`/tweets/user/${userId}`);
                setTweets(response.data.data);
            } catch (err) {
                setError('Failed to load community posts.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchTweets();
        }
    }, [userId]);

    const handleNewTweet = (newTweet) => {
        // Add the new tweet to the top of the list for instant feedback
        setTweets((prevTweets) => [newTweet, ...prevTweets]);
    };

    if (error) return <div className="text-center text-red-500">{error}</div>;

    return (
        <div className="p-4 max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-white mb-6">Community Posts</h1>
            
            {isChannelOwner && <CreateTweet onTweetCreated={handleNewTweet} />}
            
            <TweetList tweets={tweets} loading={loading} />
        </div>
    );
}

export default CommunityPage;