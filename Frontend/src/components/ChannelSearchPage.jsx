// src/pages/ChannelSearchPage.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axiosClient from '../Api/axiosClient';
import toast from 'react-hot-toast';

function ChannelSearchPage() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('query');
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!query) {
            setLoading(false);
            setChannels([]);
            return;
        }

        setLoading(true);
        axiosClient.get(`/users/search-channels?query=${query}`)
            .then(res => setChannels(res.data.data))
            .catch(() => toast.error("Failed to fetch channels."))
            .finally(() => setLoading(false));
    }, [query]);

    if (!query) {
        return (
            <div className="p-4 text-white text-center">
                <h1 className="text-3xl font-bold mb-4">Search Channels</h1>
                <p>Enter a channel name in the search bar to find channels.</p>
            </div>
        );
    }

    if (loading) return <div className="p-4 text-center text-white">Searching for channels...</div>;

    return (
        <div className="p-4 text-white">
            <h1 className="text-3xl font-bold mb-6">Channels for "{query}"</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {channels.length > 0 ? (
                    channels.map(channel => (
                        <div key={channel._id} className="flex items-center space-x-4 bg-gray-800 p-4 rounded-lg">
                            <img src={channel.avatar || 'default-avatar.png'} alt={channel.username} className="w-16 h-16 rounded-full object-cover" />
                            <div>
                                <Link to={`/channel/${channel.username}`} className="text-xl font-semibold hover:text-red-500">
                                    {channel.fullName || channel.username}
                                </Link>
                                <p className="text-gray-400">@{channel.username}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="col-span-full text-center text-gray-400">No channels found for "{query}".</p>
                )}
            </div>
        </div>
    );
}

export default ChannelSearchPage;