// src/components/AddTweetPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../Api/axiosClient';
import toast from 'react-hot-toast';
import { useAuth } from '../Context/AuthContext';

function AddTweetPage() {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleCreateTweet = async (e) => {
        e.preventDefault();
        if (!content.trim()) {
            return toast.error("Tweet cannot be empty.");
        }
        setLoading(true);
        try {
            await axiosClient.post('/tweets', { content });
            toast.success("Tweet posted successfully!");
            // Navigate to the user's own community page after posting
            navigate(`/channel/${user.username}/community`);
        } catch (error) {
            toast.error("Failed to post tweet.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 max-w-2xl mx-auto text-white">
            <h1 className="text-3xl font-bold mb-6">Create a New Post</h1>
            <form onSubmit={handleCreateTweet} className="flex flex-col space-y-4 bg-gray-800 p-6 rounded-lg">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What's happening?"
                    className="w-full p-3 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows="5"
                    maxLength="280"
                />
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">{content.length} / 280</span>
                    <button type="submit" disabled={loading} className="bg-indigo-600 font-semibold px-6 py-2 rounded-md disabled:opacity-50">
                        {loading ? "Posting..." : "Post"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AddTweetPage;