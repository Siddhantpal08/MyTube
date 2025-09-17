// src/components/CreatorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import axiosClient from '../Api/axiosClient';
import { Link } from 'react-router-dom';
import AnalyticsDashboard from './AnalyticsDashboard';

// COMPLETED: Moved table logic here and fixed image path
const MyContent = ({ videos }) => (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
        <table className="min-w-full">
            <thead className="bg-gray-700">
                <tr>
                    <th className="py-3 px-4 text-left text-sm font-semibold uppercase">Video</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold uppercase">Views</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold uppercase">Created</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold uppercase">Actions</th>
                </tr>
            </thead>
            <tbody>
                {videos.length > 0 ? (
                    videos.map((video) => (
                        <tr key={video._id} className="border-b border-gray-700 hover:bg-gray-700/50">
                            <td className="py-3 px-4 flex items-center">
                                {/* FIXED: Corrected path from video.thumbnail.url to video.thumbnail */}
                                <img src={video.thumbnail} alt={video.title} className="w-24 h-14 object-cover rounded-md mr-4" />
                                <span className="font-medium">{video.title}</span>
                            </td>
                            <td className="py-3 px-4">{video.views}</td>
                            <td className="py-3 px-4">{new Date(video.createdAt).toLocaleDateString()}</td>
                            <td className="py-3 px-4">
                                <button className="text-indigo-400 hover:text-indigo-300 mr-4 font-semibold">Edit</button>
                                <button className="text-red-500 hover:text-red-400 font-semibold">Delete</button>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="4" className="text-center py-8 text-gray-400">You haven't uploaded any videos yet.</td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
);

function CreatorDashboard() {
    const { user } = useAuth();
    const [myVideos, setMyVideos] = useState([]);
    const [activeTab, setActiveTab] = useState('content');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user?._id) {
            setLoading(false);
            return;
        }

        const fetchMyVideos = async () => {
            try {
                setLoading(true);
                const response = await axiosClient.get(`/videos?userId=${user._id}`);
                // Ensure you adjust this path if your API response is different
                setMyVideos(response.data.data.docs || []);
            } catch (err) {
                setError('Failed to fetch your videos.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchMyVideos();
    }, [user?._id]);

    if (loading) return <div className="text-center p-8 text-white">Loading your content...</div>;
    if (error) return <div className="text-center text-red-500 p-8">{error}</div>;

    return (
        <div className="p-4 md:p-6 lg:p-8 text-white">
            <h1 className="text-3xl font-bold mb-6">Creator Dashboard</h1>
            
            <div className="flex border-b border-gray-700 mb-6">
                <button 
                    onClick={() => setActiveTab('content')}
                    className={`py-2 px-4 font-semibold ${activeTab === 'content' ? 'text-white border-b-2 border-indigo-500' : 'text-gray-400 hover:text-white'}`}
                >
                    My Content
                </button>
                <button 
                    onClick={() => setActiveTab('analytics')}
                    className={`py-2 px-4 font-semibold ${activeTab === 'analytics' ? 'text-white border-b-2 border-indigo-500' : 'text-gray-400 hover:text-white'}`}
                >
                    Analytics
                </button>
            </div>

            {/* CLEANED UP: This section now cleanly renders the correct component based on the active tab */}
            <div>
                {activeTab === 'content' && <MyContent videos={myVideos} />}
                {activeTab === 'analytics' && <AnalyticsDashboard />}
            </div>
        </div>
    );
}

export default CreatorDashboard;