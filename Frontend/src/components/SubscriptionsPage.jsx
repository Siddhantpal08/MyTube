import React, { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import axiosClient from '../Api/axiosClient';
import { Link } from 'react-router-dom';
import VideoCard from './VideoCard';
import SkeletonCard from './SkeletonCard';

// New, attractive ChannelCard that is clickable
const ChannelCard = ({ channel }) => {
    // --- MIXED CONTENT FIX ---
    const secureAvatar = channel.avatar ? channel.avatar.replace('http://', 'https://') : null;
    return (
        <Link to={`/channel/${channel.username}`} className="flex flex-col items-center space-y-2 group flex-shrink-0 w-28 text-center">
            <img 
                src={secureAvatar} 
                alt={channel.username} 
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-700 group-hover:border-red-500 transition-colors duration-300" 
            />
            <h3 className="text-sm font-semibold text-white truncate w-full">{channel.fullName}</h3>
        </Link>
    );
};


function SubscriptionsPage() {
    const { user } = useAuth();
    const [channels, setChannels] = useState([]);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user?._id) {
            setLoading(false);
            return;
        };
        
        const fetchSubscriptionsData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch subscribed channels and their latest videos in parallel for speed
                const [channelsRes, videosRes] = await Promise.all([
                    axiosClient.get(`/subscriptions/u/${user._id}`),
                    axiosClient.get('/subscriptions/videos') // The new backend endpoint
                ]);
                
                // The backend now sends the channel data directly within the subscription object
                setChannels(channelsRes.data.data.map(sub => sub.channel) || []);
                setVideos(videosRes.data.data.docs || []);
            } catch (err) {
                setError("Failed to fetch your subscriptions feed.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchSubscriptionsData();
    }, [user?._id]);
    
    if (loading) {
        return (
            <div className="p-4 animate-pulse">
                <div className="h-8 w-1/3 bg-gray-800 rounded-lg mb-6"></div>
                <div className="flex space-x-6 mb-10">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center space-y-2">
                            <div className="w-24 h-24 rounded-full bg-gray-700"></div>
                            <div className="h-4 w-20 bg-gray-700 rounded"></div>
                        </div>
                    ))}
                </div>
                <div className="h-8 w-1/4 bg-gray-800 rounded-lg mb-6"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                    {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            </div>
        )
    }

    if (error) return <div className="text-center text-red-500 p-8">{error}</div>;

    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold text-white mb-6">Subscriptions</h1>
            
            {channels.length > 0 ? (
                <>
                    {/* Subscribed Channels Carousel */}
                    <div className="mb-10">
                        <h2 className="text-xl font-semibold text-gray-300 mb-4">Your Channels</h2>
                        <div className="flex space-x-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                            {channels.map((channel) => (
                                <ChannelCard key={channel._id} channel={channel} />
                            ))}
                        </div>
                    </div>

                    {/* Latest Videos Feed */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-300 mb-4">Latest Videos</h2>
                        {videos.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8">
                                {videos.map((video) => (
                                    <VideoCard key={video._id} video={video} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-400 py-16 bg-gray-800 rounded-lg">
                                <h3 className="text-lg font-semibold">No new videos</h3>
                                <p className="mt-2">New videos from your subscribed channels will appear here.</p>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="text-center text-gray-400 py-16">
                    <h2 className="text-xl font-semibold">You haven't subscribed to any channels yet.</h2>
                    <Link to="/explore" className="mt-4 inline-block bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700">
                        Explore Channels
                    </Link>
                </div>
            )}
        </div>
    );
}

export default SubscriptionsPage;