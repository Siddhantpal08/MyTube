// src/pages/ChannelPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axiosClient from '../Api/axiosClient';
import VideoCard from '../components/VideoCard'; // Assuming you have this
import { useAuth } from '../Context/AuthContext';
import toast from 'react-hot-toast';

function ChannelPage() {
    const { username } = useParams();
    const { user } = useAuth(); // Logged-in user context
    const [channel, setChannel] = useState(null);
    const [channelVideos, setChannelVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscribersCount, setSubscribersCount] = useState(0);

    useEffect(() => {
        const fetchChannelData = async () => {
            setLoading(true);
            try {
                // Fetch channel details
                const channelRes = await axiosClient.get(`/users/c/${username}`);
                setChannel(channelRes.data.data);
                const channelId = channelRes.data.data._id;

                // Fetch subscription status and count
                const subStatusRes = await axiosClient.get(`/subscriptions/c/${channelId}`);
                setIsSubscribed(subStatusRes.data.data.isSubscribed);
                setSubscribersCount(subStatusRes.data.data.subscribersCount);

                // Fetch channel's videos
                const videosRes = await axiosClient.get(`/videos?userId=${channelId}`);
                setChannelVideos(videosRes.data.data.docs);

            } catch (error) {
                toast.error("Failed to load channel data.");
                console.error("Failed to fetch channel data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (username) {
            fetchChannelData();
        }
    }, [username, user?._id]); // Re-fetch if username or logged-in user changes

    const handleToggleSubscription = async () => {
        if (!user) {
            return toast.error("Please log in to subscribe.");
        }
        try {
            const endpoint = `/subscriptions/c/${channel._id}`;
            await axiosClient.post(endpoint);

            setIsSubscribed(prev => !prev);
            setSubscribersCount(prev => isSubscribed ? prev - 1 : prev + 1);
            toast.success(isSubscribed ? "Unsubscribed!" : "Subscribed!");

        } catch (error) {
            toast.error("Failed to toggle subscription.");
            console.error("Subscription toggle failed:", error);
        }
    };

    if (loading) return <div className="p-8 text-center text-white">Loading channel...</div>;
    if (!channel) return <div className="p-8 text-center text-red-500">Channel not found.</div>;

    // Determine if the current user is viewing their own channel
    const isOwner = user?._id === channel._id;

    return (
        <div className="p-4 text-white">
            {/* Channel Header */}
            <div className="bg-gray-800 rounded-lg p-6 mb-8 flex flex-col md:flex-row items-center md:justify-between">
                <div className="flex items-center space-x-6">
                    <img src={channel.avatar || 'default-avatar.png'} alt={channel.username} className="w-24 h-24 rounded-full object-cover border-2 border-red-500" />
                    <div>
                        <h1 className="text-4xl font-bold">{channel.fullName || channel.username}</h1>
                        <p className="text-gray-400 text-lg">@{channel.username}</p>
                        <p className="text-gray-500">{subscribersCount} subscribers</p>
                    </div>
                </div>
                {!isOwner && user && ( // Only show subscribe button if not owner and logged in
                    <button
                        onClick={handleToggleSubscription}
                        className={`mt-4 md:mt-0 py-2 px-6 rounded-lg font-semibold transition-colors duration-300 ${
                            isSubscribed ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-600 hover:bg-red-700'
                        }`}
                    >
                        {isSubscribed ? 'Subscribed' : 'Subscribe'}
                    </button>
                )}
                {isOwner && (
                     <Link to="/my-videos" className="mt-4 md:mt-0 py-2 px-6 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-700">
                        Manage My Videos
                    </Link>
                )}
            </div>

            {/* Channel Videos */}
            <h2 className="text-3xl font-bold mb-6">Videos from {channel.fullName || channel.username}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {channelVideos.length > 0 ? (
                    channelVideos.map(video => <VideoCard key={video._id} video={video} />)
                ) : (
                    <p className="col-span-full text-center text-gray-400">No videos uploaded by this channel yet.</p>
                )}
            </div>
        </div>
    );
}

export default ChannelPage;