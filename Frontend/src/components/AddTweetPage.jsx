import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// FIX: Corrected import paths for utilities, API client, and context
import axiosClient from '../Api/axiosClient'; 
import toast from 'react-hot-toast';
import { useAuth } from '../Context/AuthContext';
import { placeholderAvatar } from '../utils/formatters';

function AddTweetPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    // FIX: Safely determine the avatar URL by checking for both string and object formats
    const userAvatarUrl = user?.avatar?.url 
        ? user.avatar.url       // Case 1: Avatar is an object with a 'url' property
        : user?.avatar;         // Case 2: Avatar is a direct URL string

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) {
            return toast.error("Post content cannot be empty.");
        }

        setLoading(true);
        const toastId = toast.loading("Publishing your post...");

        try {
            await axiosClient.post('/tweets', { content });
            toast.success("Post published successfully!", { id: toastId });
            // Added a slight delay to ensure toast shows before navigation
            setTimeout(() => navigate('/community'), 100); 
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to publish post.", { id: toastId });
            console.error("Failed to add tweet:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create a new post</h1>
                <button 
                    onClick={() => navigate(-1)} // Go back to the previous page
                    className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
                >
                    {/* Replaced SVG with Lucide icon for better maintainability and look */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-start space-x-4">
                    {/* FIX APPLIED HERE: Use the robustly determined userAvatarUrl */}
                    <img 
                        src={userAvatarUrl || placeholderAvatar} 
                        alt={user?.username || "User"} 
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0" 
                    />
                    <form onSubmit={handleSubmit} className="flex-1">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={`What's on your mind, ${user?.username || 'user'}?`}
                            className="w-full h-32 p-2 bg-transparent text-gray-900 dark:text-white text-lg placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none resize-none"
                            maxLength="280"
                        />
                        <div className="flex justify-between items-center mt-2 border-t border-gray-200 dark:border-gray-700 pt-3">
                             {/* Added conditional styling for max length warning */}
                             <span 
                                className={`text-sm mr-4 ${content.length >= 280 ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}
                            >
                                {content.length} / 280
                            </span>
                            <button
                                type="submit"
                                disabled={loading || !content.trim()}
                                className="bg-red-600 text-white font-bold py-2 px-6 rounded-full hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                            >
                                {loading ? 'Posting...' : 'Post'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AddTweetPage;