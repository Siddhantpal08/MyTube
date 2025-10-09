import React from 'react';
import { useAuth } from '../Context/AuthContext';
import axiosClient from '../Api/axiosClient';
import { Link } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import SkeletonCard from '../components/SkeletonCard';

const ChannelCard = ({ channel }) => {
    const secureAvatar = channel.avatar ? channel.avatar.replace('http://', 'https://') : null;
    return (
        <Link to={`/channel/${channel.username}`} className="flex flex-col items-center space-y-2 group flex-shrink-0 w-28 text-center">
            <img 
                src={secureAvatar} 
                alt={channel.username} 
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-300 dark:border-gray-700 group-hover:border-red-500 transition-colors duration-300" 
            />
            <h3 className="text-sm font-semibold truncate w-full">{channel.fullName}</h3>
        </Link>
    );
};

function SubscriptionsPage() {
    const { user } = useAuth();
    const [channels, setChannels] = React.useState([]);
    const [videos, setVideos] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        if (!user?._id) {
            setLoading(false);
            return;
        };
        
        const fetchSubscriptionsData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [channelsRes, videosRes] = await Promise.all([
                    axiosClient.get(`/subscriptions/u/${user._id}`),
                    axiosClient.get('/subscriptions/videos')
                ]);
                
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
                <div className="h-8 w-1/3 rounded-lg mb-6 bg-gray-200 dark:bg-gray-800"></div>
                <div className="flex space-x-6 mb-10 overflow-x-hidden">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center space-y-2 flex-shrink-0">
                            <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                            <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700"></div>
                        </div>
                    ))}
                </div>
                <div className="h-8 w-1/4 rounded-lg mb-6 bg-gray-200 dark:bg-gray-800"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            </div>
        );
    }

    if (error) return <div className="text-center text-red-500 p-8">{error}</div>;

    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold mb-6">Subscriptions</h1>
            
            {channels.length > 0 ? (
                <div className="space-y-12">
                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-300">Your Channels</h2>
                        <div className="flex space-x-6 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-gray-100 dark:scrollbar-track-gray-900">
                            {channels.map((channel) => (
                                <ChannelCard key={channel._id} channel={channel} />
                            ))}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-300">Latest Videos</h2>
                        {videos.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                                {videos.map((video) => (
                                    <VideoCard key={video._id} video={video} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                <h3 className="text-lg font-semibold">No new videos</h3>
                                <p className="mt-2">Your subscribed channels haven't posted anything new recently.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="text-center py-16 text-gray-500 dark:text-gray-400">
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