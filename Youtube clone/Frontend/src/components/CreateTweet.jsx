// src/components/CreateTweet.jsx
import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';

function CreateTweet({ onTweetCreated }) {
    const [content, setContent] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (content.trim() === '') {
            setError('Tweet content cannot be empty.');
            return;
        }
        try {
            // Assuming your backend has an endpoint to create a tweet
            const response = await axiosClient.post('/tweets', { content });
            setContent('');
            setError('');
            // Notify the parent component that a new tweet has been created
            if (onTweetCreated) {
                onTweetCreated(response.data.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to post tweet.');
            console.error(err);
        }
    };

    return (
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
            <form onSubmit={handleSubmit}>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write a community post..."
                    className="w-full p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows="3"
                ></textarea>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                <div className="text-right mt-2">
                    <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md"
                    >
                        Post
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CreateTweet;