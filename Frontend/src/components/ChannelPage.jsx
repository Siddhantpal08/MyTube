import React, { useState, useEffect } from 'react';
import { useParams, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import axiosClient from '../Api/axiosClient';
import VideoCard from '../components/VideoCard';
import { useAuth } from '../Context/AuthContext';
import toast from 'react-hot-toast';
import { formatCompactNumber, placeholderAvatar } from '../utils/formatters';
import ChannelAboutTab from './ChannelAboutTab';

function ChannelPage() {
    const { username } = useParams();
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [channel, setChannel] = useState(null);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscribersCount, setSubscribersCount] = useState(0);
    
    const location = useLocation();
    const activeTab = location.pathname.endsWith('/about') ? 'about' : 'videos';

    useEffect(() => {
        const fetchChannelData = async () => {
            if (!username) return;
            setLoading(true);
            setError(null);
            try {
                const [channelRes, videosRes] = await Promise.all([
                    axiosClient.get(`/users/c/${username}`),
                    axiosClient.get(`/videos?username=${username}`)
                ]);
                const channelData = channelRes.data.data;
                setChannel(channelData);
                setVideos(videosRes.data.data.docs || []);
                setSubscribersCount(channelData.subscribersCount);
                setIsSubscribed(channelData.isSubscribed);
            } catch (err) {
                console.error("Failed to fetch channel data:", err);
                setError(err.response?.data?.message || "Could not load the channel.");
            } finally {
                setLoading(false);
            }
        };
        fetchChannelData();
    }, [username, isAuthenticated]);

    const handleToggleSubscription = async () => {
        if (!isAuthenticated) {
            toast.error("Please log in to subscribe.");
            return navigate("/login");
        }
        
        const originalSubState = isSubscribed;
        setIsSubscribed(prev => !prev);
        setSubscribersCount(prev => originalSubState ? prev - 1 : prev + 1);

        try {
            await axiosClient.post(`/subscriptions/c/${channel._id}`);
        } catch (error) {
            setIsSubscribed(originalSubState);
            setSubscribersCount(prev => originalSubState ? prev + 1 : prev - 1);
            toast.error("Failed to update subscription.");
        }
    };

    if (loading) return <div className="p-8 text-center text-lg font-medium text-gray-700 dark:text-gray-300">Loading channel...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!channel) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Channel not found.</div>;

    const isOwner = user?._id === channel._id;
    const secureCoverImage = channel.coverImage?.replace('http://', 'https://');
    const avatarUrl = channel.avatar?.url || channel.avatar;
    const secureAvatar = avatarUrl ? avatarUrl.replace('http://', 'https://') : placeholderAvatar;

    return (
        <div className="w-full min-h-screen">
            {/* --- Channel Header --- */}
            <div className="w-full">
                <div className="h-40 md:h-52 bg-gray-300 dark:bg-gray-700">
                    {secureCoverImage && <img src={secureCoverImage} alt="Cover" className="w-full h-full object-cover" />}
                </div>
                <div className="bg-white dark:bg-[#121212] py-4 shadow-md">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 sm:-mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <img src={secureAvatar} alt={channel.username} className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white dark:border-[#121212] flex-shrink-0" />
                        <div className="ml-4 mt-4 sm:mt-0 flex-1 min-w-0 text-center sm:text-left">
                            <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white truncate">{channel.fullName}</h1>
                            <div className="flex justify-center sm:justify-start items-center space-x-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                <span>@{channel.username}</span>
                                <span>{formatCompactNumber(subscribersCount)} subscribers</span>
                            </div>
                        </div>
                        <div className="mt-4 sm:mt-0">
                            {isOwner ? ( <Link to="/settings" className="font-bold py-2 px-5 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Edit Channel</Link> ) : (
                                isAuthenticated && <button onClick={handleToggleSubscription} className={`font-bold py-2 px-5 rounded-full transition-colors duration-200 ${isSubscribed ? 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500' : 'bg-red-600 hover:bg-red-700 text-white'}`}>{isSubscribed ? 'Subscribed' : 'Subscribe'}</button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Channel Navigation Tabs --- */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <NavLink to={`/channel/${username}`} end className={({isActive}) => `py-3 font-medium border-b-2 ${isActive ? 'text-red-500 border-red-500' : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-black dark:hover:text-white'}`}>Videos</NavLink>
                    <NavLink to={`/channel/${username}/about`} className={({isActive}) => `py-3 font-medium border-b-2 ${isActive ? 'text-red-500 border-red-500' : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-black dark:hover:text-white'}`}>About</NavLink>
                </nav>
            </div>
            
            {/* --- Tab Content --- */}
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                {activeTab === 'videos' && (
                    <>
                        {videos.length > 0 ? (
                            // --- THIS IS THE FIX ---
                            // This grid now matches your Subscriptions page for a consistent, responsive layout.
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                                {videos.map(video => <VideoCard key={video._id} video={video} />)}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 dark:text-gray-400 py-16">
                                <h2 className="text-xl font-semibold">This channel hasn't uploaded any videos.</h2>
                            </div>
                        )}
                    </>
                )}
                {activeTab === 'about' && <ChannelAboutTab channel={channel} />}
            </div>
        </div>
    );
}

export default ChannelPage;