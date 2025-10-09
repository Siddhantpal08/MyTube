import React, { useState, useEffect } from 'react';
import axiosClient from '../Api/axiosClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../Context/ThemeContext'; // Import useTheme

// StatCard now has theme-aware styles
const StatCard = ({ title, value }) => (
    <div className="p-6 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value?.toLocaleString() || 0}</p>
    </div>
);

function AnalyticsDashboard() {
    const { theme } = useTheme(); // Get the current theme
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


    
    // Define chart colors based on the theme
    const gridColor = theme === 'dark' ? '#4A5568' : '#E2E8F0';
    const textColor = theme === 'dark' ? '#A0AEC0' : '#4A5568';
    const tooltipBg = theme === 'dark' ? '#1A202C' : '#FFFFFF';

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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard title="Total Views" value={stats.totalViews} />
                <StatCard title="Total Subscribers" value={stats.totalSubscribers} />
                <StatCard title="Total Likes" value={stats.totalLikes} />
                <StatCard title="Total Videos" value={stats.totalVideos} />
            </div>

            <div className="p-6 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-lg mb-4">Likes (Last 30 Days)</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                            <XAxis dataKey="date" stroke={textColor} />
                            <YAxis stroke={textColor} />
                            <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: '1px solid #4A5568', borderRadius: '0.5rem' }} />
                            <Legend />
                            <Line type="monotone" dataKey="views" name="Likes per day" stroke="#8B5CF6" strokeWidth={2} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

export default AnalyticsDashboard;