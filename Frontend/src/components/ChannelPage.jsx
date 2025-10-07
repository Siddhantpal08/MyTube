import React, { useState, useEffect } from 'react';
import { useParams, NavLink, Link, useLocation } from 'react-router-dom';
import axiosClient from '../Api/axiosClient';
import VideoCard from '../components/VideoCard';
import { useAuth } from '../Context/AuthContext';
import toast from 'react-hot-toast';
import { formatCompactNumber, placeholderAvatar } from '../utils/formatters';
import ChannelAboutTab from './ChannelAboutTab';

function ChannelPage() {
    const { username } = useParams();
    const { user, isAuthenticated, navigate } = useAuth();
    const [channel, setChannel] = useState(null);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscribersCount, setSubscribersCount] = useState(0);
    const location = useLocation();
    const activeTab = location.pathname.split('/').pop() === 'about' ? 'about' : 'videos';

    useEffect(() => {
        const fetchChannelData = async () => {
            if (!username) return;
            setLoading(true);
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
                setError(err.response?.data?.message || "Could not load channel.");
            } finally {
                setLoading(false);
            }
        };
        fetchChannelData();
    }, [username, isAuthenticated]);

    // ... (your handleToggleSubscription function is fine) ...

    if (loading) return <div className="p-8 text-center text-white">Loading channel...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    const isOwner = user?._id === channel?._id;
    
    // --- MIXED CONTENT FIX ---
    const secureCoverImage = channel.coverImage ? channel.coverImage.replace('http://', 'https://') : null;
    const secureAvatar = channel.avatar ? channel.avatar.replace('http://', 'https') : placeholderAvatar;

    return (
        <div>
            {/* --- Channel Header --- */}
            <div className="w-full">
                <div className="h-40 md:h-52 w-full bg-gray-700">
                    {secureCoverImage && <img src={secureCoverImage} alt="Cover" className="w-full h-full object-cover" />}
                </div>
                <div className="p-4 sm:p-6 bg-[#121212]">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 sm:-mt-20">
                        <img src={secureAvatar} alt={channel.username} className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-[#121212]" />
                        <div className="ml-4 mt-4 sm:mt-0 flex-1">
                            <h1 className="text-2xl sm:text-3xl font-bold text-white">{channel.fullName}</h1>
                            <div className="flex items-center space-x-3 text-sm text-gray-400">
                                <span>@{channel.username}</span>
                                <span>{formatCompactNumber(subscribersCount)} subscribers</span>
                            </div>
                        </div>
                        {/* ... (subscribe/edit buttons) ... */}
                    </div>
                </div>
            </div>

            {/* --- Channel Navigation Tabs --- */}
            <div className="border-b border-gray-700 mt-2 px-4 sm:px-6">
                <nav className="flex space-x-4">
                    <NavLink to={`/channel/${username}`} end className={({isActive}) => `py-3 font-medium border-b-2 ${isActive ? 'text-white border-white' : 'text-gray-400 border-transparent hover:text-white'}`}>Videos</NavLink>
                    <NavLink to={`/channel/${username}/about`} className={({isActive}) => `py-3 font-medium border-b-2 ${isActive ? 'text-white border-white' : 'text-gray-400 border-transparent hover:text-white'}`}>About</NavLink>
                </nav>
            </div>
            
            {/* --- Tab Content with Less Congested Layout --- */}
            {activeTab === 'videos' && (
                <div className="p-4 sm:p-6">
                    {videos.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
                            {videos.map(video => <VideoCard key={video._id} video={video} />)}
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 py-16">
                            <h2 className="text-xl font-semibold">No videos have been uploaded.</h2>
                        </div>
                    )}
                </div>
            )}
            {activeTab === 'about' && <ChannelAboutTab channel={channel} />}
        </div>
    );
}

export default ChannelPage;