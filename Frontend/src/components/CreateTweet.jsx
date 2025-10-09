import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../Api/axiosClient';
import { useAuth } from '../Context/AuthContext';
import toast from 'react-hot-toast';
import { placeholderAvatar } from '../utils/formatters';

function CreateTweet({ onTweetCreated }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) {
            return toast.error("Post content cannot be empty.");
        }

        setLoading(true);
        const toastId = toast.loading("Publishing your post...");

        try {
            const response = await axiosClient.post('/tweets', { content });
            
            toast.success("Post published successfully!", { id: toastId });

            if (onTweetCreated) {
                onTweetCreated(response.data.data);
            } else {
                navigate('/community');
            }

        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to publish post.", { id: toastId });
            console.error("Failed to add tweet:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="flex items-start space-x-4">
                {/* Proactive Fix: Use user?.avatar?.url */}
                <img src={user?.avatar?.url || placeholderAvatar} alt={user?.username} className="w-12 h-12 rounded-full object-cover" />
                <form onSubmit={handleSubmit} className="flex-1">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={`What's on your mind, ${user?.username}?`}
                        className="w-full h-28 p-2 bg-transparent text-lg focus:outline-none resize-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500"
                        maxLength="280"
                    />
                    <div className="flex justify-end items-center mt-2 border-t border-gray-200 dark:border-gray-700 pt-3">
                        <span className="text-sm text-gray-500 mr-4">{content.length} / 280</span>
                        <button
                            type="submit"
                            disabled={loading || !content.trim()}
                            className="bg-red-600 text-white font-bold py-2 px-6 rounded-full hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Posting...' : 'Post'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateTweet;