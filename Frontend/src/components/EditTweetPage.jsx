import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axiosClient from '../Api/axiosClient';
import toast from 'react-hot-toast';
import { useAuth } from '../Context/AuthContext';

function EditTweetPage() {
    const { tweetId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [originalContent, setOriginalContent] = useState('');
    const [loading, setLoading] = useState(true);

    // Fetch the tweet's current content when the page loads
    useEffect(() => {
        const fetchTweet = async () => {
            try {
                // We need a backend route to get a single tweet by its ID
                const response = await axiosClient.get(`/tweets/${tweetId}`); 
                const tweet = response.data.data;

                // Security check: ensure the current user is the owner
                if (user?._id !== tweet.owner._id) {
                    toast.error("You are not authorized to edit this post.");
                    navigate("/community");
                    return;
                }

                setContent(tweet.content);
                setOriginalContent(tweet.content);
            } catch (error) {
                toast.error("Could not load the post for editing.");
                navigate("/community");
            } finally {
                setLoading(false);
            }
        };
        fetchTweet();
    }, [tweetId, navigate, user?._id]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!content.trim()) {
            return toast.error("Post content cannot be empty.");
        }
        if (content.trim() === originalContent) {
            return toast("No changes were made.");
        }

        const toastId = toast.loading("Saving changes...");
        try {
            await axiosClient.patch(`/tweets/${tweetId}`, { content });
            toast.success("Post updated successfully!", { id: toastId });
            navigate('/community');
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update post.", { id: toastId });
        }
    };

    if (loading) {
        return <div className="text-center p-8 text-white">Loading post for editing...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto p-4 text-white">
            <h1 className="text-3xl font-bold mb-6">Edit Post</h1>
            <form onSubmit={handleUpdate} className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full h-32 p-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows="5"
                    maxLength="280"
                />
                <div className="flex justify-between items-center mt-4">
                    <span className="text-sm text-gray-400">{content.length} / 280</span>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => navigate(-1)} className="font-semibold px-6 py-2 rounded-md bg-gray-600 hover:bg-gray-500 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" className="font-semibold px-6 py-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors">
                            Save Changes
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default EditTweetPage;