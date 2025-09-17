// src/components/AnalyticsDashboard.jsx
import React, { useState, useEffect } from 'react';
import axiosClient from '../Api/axiosClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// A simple card for displaying a key statistic
const StatCard = ({ title, value }) => (
    <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        <p className="text-3xl font-bold text-white mt-2">{value?.toLocaleString() || 0}</p>
    </div>
);

function AnalyticsDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const response = await axiosClient.get('/dashboard/stats');
                setStats(response.data.data);
            } catch (err) {
                setError('Failed to load analytics data.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="text-center p-8">Loading analytics...</div>;
    if (error) return <div className="text-center text-red-500 p-8">{error}</div>;
    if (!stats) return <div className="text-center p-8">No analytics data available.</div>;

    // Format date for the chart to be more readable
    const chartData = stats.viewsLast30Days.map(item => ({
        ...item,
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));

    return (
        <div>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard title="Total Views" value={stats.totalViews} />
                <StatCard title="Total Subscribers" value={stats.totalSubscribers} />
                <StatCard title="Total Likes" value={stats.totalLikes} />
                <StatCard title="Total Videos" value={stats.totalVideos} />
            </div>

            {/* Views Chart */}
            <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="font-bold text-lg mb-4">Likes (Last 30 Days)</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                            <XAxis dataKey="date" stroke="#A0AEC0" />
                            <YAxis stroke="#A0AEC0" />
                            <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: 'none', borderRadius: '0.5rem' }} />
                            <Legend />
                            <Line 
                                type="monotone" 
                                dataKey="views" 
                                name="Likes per day" 
                                stroke="#8B5CF6" 
                                strokeWidth={2} 
                                activeDot={{ r: 8 }} 
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

export default AnalyticsDashboard;