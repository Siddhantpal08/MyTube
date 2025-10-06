import React, { useState, useEffect } from 'react';
import { useParams, Link, NavLink } from 'react-router-dom';
import axiosClient from '../Api/axiosClient';
import VideoCard from '../components/VideoCard';
import { useAuth } from '../Context/AuthContext';
import toast from 'react-hot-toast';
import { formatCompactNumber, placeholderAvatar } from '../utils/formatters';

function ChannelPage() {
    const { username } = useParams();
    const { user, isAuthenticated } = useAuth();
    const [channel, setChannel] = useState(null);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchChannelData = async () => {
            if (!username) return;
            setLoading(true);
            setError(null);
            try {
                // --- THE FIX: Fetch all data in parallel for better performance ---
                const [channelRes, videosRes] = await Promise.all([
                    axiosClient.get(`/users/c/${username}`),
                    axiosClient.get(`/videos?username=${username}`) // Assuming your backend can filter videos by username
                ]);

                const channelData = channelRes.data.data;
                setChannel(channelData);
                setVideos(videosRes.data.data.docs);
                
                // Set subscription status from the channel data
                setSubscribersCount(channelData.subscribersCount);
                setIsSubscribed(channelData.isSubscribed);

            } catch (err) {
                console.error("Failed to fetch channel data:", err);
                setError("Could not load the channel. It may not exist or the API is down.");
            } finally {
                setLoading(false);
            }
        };
        fetchChannelData();
    }, [username, isAuthenticated]); // Re-fetch if the logged-in user changes

    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscribersCount, setSubscribersCount] = useState(0);

    const handleToggleSubscription = async () => {
        if (!isAuthenticated) return toast.error("Please log in to subscribe.");
        
        // Optimistic UI update for instant feedback
        setIsSubscribed(prev => !prev);
        setSubscribersCount(prev => isSubscribed ? prev - 1 : prev + 1);

        try {
            await axiosClient.post(`/subscriptions/c/${channel._id}`);
        } catch (error) {
            // Revert state if the API call fails
            setIsSubscribed(prev => !prev);
            setSubscribersCount(prev => isSubscribed ? prev + 1 : prev - 1);
            toast.error("Failed to toggle subscription.");
        }
    };

    if (loading) return <div className="p-8 text-center text-white">Loading channel...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!channel) return <div className="p-8 text-center text-gray-400">Channel not found.</div>;

    const isOwner = user?._id === channel._id;

    return (
        <div>
            {/* --- Channel Header with Cover Image --- */}
            <div className="w-full">
                <div className="h-40 md:h-52 bg-gray-700">
                    {channel.coverImage && <img src={channel.coverImage} alt="Cover" className="w-full h-full object-cover" />}
                </div>
                <div className="px-4 sm:px-6 lg:px-8 bg-gray-800 py-4">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 sm:-mt-20">
                        <img src={channel.avatar || placeholderAvatar} alt={channel.username} className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-gray-800 bg-gray-800" />
                        <div className="ml-4 mt-4 sm:mt-0 flex-1">
                            <h1 className="text-2xl sm:text-3xl font-bold text-white">{channel.fullName}</h1>
                            <div className="flex items-center space-x-3 text-sm text-gray-400">
                                <span>@{channel.username}</span>
                                <span>{formatCompactNumber(subscribersCount)} subscribers</span>
                            </div>
                        </div>
                        {!isOwner && isAuthenticated && (
                            <button
                                onClick={handleToggleSubscription}
                                className={`font-bold py-2 px-5 rounded-full transition-colors duration-200 ${isSubscribed ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-700'}`}
                            >
                                {isSubscribed ? 'Subscribed' : 'Subscribe'}
                            </button>
                        )}
                        {isOwner && (
                            <Link to="/creator/dashboard" className="font-bold py-2 px-5 rounded-full bg-red-600 hover:bg-red-700 transition-colors">
                                Manage
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* --- Channel Navigation --- */}
            <div className="border-b border-gray-700 mt-4 px-4 sm:px-6 lg:px-8">
                <nav className="flex space-x-4">
                    <NavLink to={`/channel/${username}`} end className={({isActive}) => `py-3 font-medium border-b-2 ${isActive ? 'text-white border-white' : 'text-gray-400 border-transparent hover:text-white'}`}>Videos</NavLink>
                </nav>
            </div>
            
            {/* --- Video Grid --- */}
            <div className="p-4 sm:p-6 lg:p-8">
                {videos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
                        {videos.map(video => <VideoCard key={video._id} video={video} />)}
                    </div>
                ) : (
                    <div className="text-center text-gray-400 py-16">
                        <h2 className="text-xl font-semibold">No videos yet.</h2>
                        {isOwner && <p className="mt-2">Upload your first video to get started!</p>}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ChannelPage;