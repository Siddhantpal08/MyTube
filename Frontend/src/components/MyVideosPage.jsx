import React, { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import axiosClient from '../Api/axiosClient';
import VideoCard from '../components/VideoCard'; 
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function MyVideosPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchVideos = async () => {
        if (!user?._id) return;
        setLoading(true);
        try {
            const res = await axiosClient.get(`/videos?userId=${user._id}`);
            setVideos(res.data.data.docs || []);
        } catch (error) {
            console.error("Failed to fetch user videos:", error);
            toast.error("Failed to load your videos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVideos();
    }, [user?._id]);

    const handleDeleteVideo = async (videoId) => {
        if (!window.confirm("Are you sure you want to delete this video? This action cannot be undone.")) {
            return;
        }

        const originalVideos = videos;
        // Optimistically remove the video from the UI
        setVideos(prev => prev.filter(video => video._id !== videoId));

        const toastId = toast.loading("Deleting video...");
        try {
            // API call to delete the video
            await axiosClient.delete(`/videos/${videoId}`);
            toast.success("Video deleted successfully.", { id: toastId });
        } catch (error) {
            console.error("Video deletion failed:", error);
            toast.error(error.response?.data?.message || "Failed to delete video.", { id: toastId });
            // Revert the UI state on failure
            setVideos(originalVideos);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-800 dark:text-white">Loading your videos...</div>;

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Videos</h1>
                <Link to="/upload-video" className="bg-red-600 text-white font-bold py-2 px-4 rounded-md shadow-md hover:bg-red-700 transition-colors">
                    Upload Video
                </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {videos.length > 0 ? (
                    videos.map(video => (
                        <div key={video._id} className="relative group">
                            {/* The original VideoCard component */}
                            <VideoCard video={video} />
                            
                            {/* Edit/Delete Action Overlay */}
                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl">
                                
                                {/* Edit Button */}
                                <Link
                                    to={`/edit-video/${video._id}`}
                                    className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:bg-indigo-700 transition-colors mr-2 text-sm"
                                >
                                    Edit
                                </Link>
                                
                                {/* Delete Button */}
                                <button
                                    onClick={() => handleDeleteVideo(video._id)}
                                    className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:bg-red-700 transition-colors text-sm"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="col-span-full text-center text-gray-500 dark:text-gray-400">You haven't uploaded any videos yet.</p>
                )}
            </div>
        </div>
    );
}

export default MyVideosPage;