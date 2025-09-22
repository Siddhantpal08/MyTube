// src/components/SubscriptionsPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../Api/axiosClient';
import { Link } from 'react-router-dom';
import SkeletonCard from './SkeletonCard'; // Reusing our skeleton loader

// A simple card to display a subscribed channel
const ChannelCard = ({ channel }) => (
    <div className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg">
        <img src={channel.avatar} alt={channel.username} className="w-16 h-16 rounded-full" />
        <div>
            <h3 className="text-lg font-bold">{channel.username}</h3>
            <p className="text-sm text-gray-400">{channel.fullName}</p>
        </div>
    </div>
);

function SubscriptionsPage() {
    const { user } = useAuth();
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user?._id) return;
        
        const fetchSubscribedChannels = async () => {
            try {
                setLoading(true);
                // This calls the backend route you already have: GET /subscriptions/u/:subscriberId
                const response = await axiosClient.get(`/subscriptions/u/${user._id}`);
                setChannels(response.data.data || []);
            } catch (err) {
                setError("Failed to fetch subscriptions.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchSubscribedChannels();
    }, [user?._id]);
    
    if (loading) {
        return (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 bg-gray-800 rounded-lg animate-pulse"></div>)}
            </div>
        )
    }

    if (error) return <div className="text-center text-red-500 p-8">{error}</div>;

    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold text-white mb-6">My Subscriptions</h1>
            {channels.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {channels.map((channel) => (
                        <ChannelCard key={channel._id} channel={channel} />
                    ))}
                </div>
            ) : (
                <div className="text-center text-gray-400 p-8">
                    <p>You haven't subscribed to any channels yet.</p>
                </div>
            )}
        </div>
    );
}

export default SubscriptionsPage;