// src/components/TweetList.jsx
import React from 'react';

// A small sub-component for displaying a single tweet card
const TweetCard = ({ tweet }) => (
    <div className="bg-gray-800 p-4 rounded-lg flex items-start space-x-4">
        <img src={tweet.owner?.avatar} alt={tweet.owner?.username} className="w-12 h-12 rounded-full" />
        <div>
            <div className="flex items-center space-x-2">
                <p className="font-bold text-white">{tweet.owner?.username}</p>
                <p className="text-xs text-gray-400">{new Date(tweet.createdAt).toLocaleString()}</p>
            </div>
            <p className="text-gray-300 mt-1">{tweet.content}</p>
        </div>
    </div>
);


function TweetList({ tweets, loading }) {
    if (loading) {
        return <div className="text-center text-white">Loading posts...</div>;
    }

    if (tweets.length === 0) {
        return <div className="text-center text-gray-400 p-8">This channel hasn't posted anything yet.</div>;
    }

    return (
        <div className="space-y-4">
            {tweets.map((tweet) => (
                <TweetCard key={tweet._id} tweet={tweet} />
            ))}
        </div>
    );
}

export default TweetList;