import React, { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import axiosClient from '../Api/axiosClient';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AnalyticsDashboard from '../components/AnalyticsDashboard'; 
// Assuming the ConfirmationModal component is available
import ConfirmationModal from '../components/ConfirmationModal'; 

// --- MyContent Sub-Component (Handles Table Display and Actions) ---
const MyContent = ({ videos, onEdit, onDelete }) => (
    <div className="rounded-lg overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl">
        <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">Video</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">Views</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">Created</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {videos.length > 0 ? (
                    videos.map((video) => (
                        <tr key={video._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="py-3 px-4 flex items-center">
                                <Link to={`/watch/${video._id}`} className="flex items-center group">
                                    <img src={video.thumbnail} alt={video.title} className="w-24 h-14 object-cover rounded-md mr-4" />
                                    <span className="font-medium text-gray-900 dark:text-white group-hover:text-red-500">{video.title}</span>
                                </Link>
                            </td>
                            <td className="py-3 px-4 text-gray-800 dark:text-gray-300">{video.views}</td>
                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{new Date(video.createdAt).toLocaleDateString()}</td>
                            <td className="py-3 px-4 whitespace-nowrap">
                                {/* Edit Button */}
                                <button
                                    onClick={() => onEdit(video._id)}
                                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mr-4 font-semibold p-1 rounded-md transition-colors"
                                >
                                    Edit
                                </button>
                                {/* Delete Button */}
                                <button
                                    onClick={() => onDelete(video._id)}
                                    className="text-red-600 dark:text-red-500 hover:text-red-800 dark:hover:text-red-400 font-semibold p-1 rounded-md transition-colors"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="4" className="text-center py-8 text-gray-500 dark:text-gray-400">You haven't uploaded any videos yet.</td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
);

// --- Main CreatorDashboard Component ---
function CreatorDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [myVideos, setMyVideos] = useState([]);
    const [activeTab, setActiveTab] = useState('content');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // State for modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [videoToDeleteId, setVideoToDeleteId] = useState(null);

    // --- Data Fetching Logic ---
    const fetchMyVideos = async () => {
        if (!user?._id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await axiosClient.get(`/videos?userId=${user._id}`);
            setMyVideos(response.data.data.docs || []);
            setError(null);
        } catch (err) {
            setError('Failed to fetch your videos.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyVideos();
    }, [user?._id]);

    // --- Action Handlers ---

    // 1. Initiates the deletion process by showing the modal
    const confirmDelete = (videoId) => {
        setVideoToDeleteId(videoId);
        setShowDeleteModal(true);
    };

    // 2. Executes the deletion after modal confirmation
    const handleDeleteVideo = async () => {
        setShowDeleteModal(false); // Hide the modal immediately
        if (!videoToDeleteId) return;

        const videoId = videoToDeleteId;
        const originalVideos = myVideos;
        
        // Optimistically remove the video from the UI
        setMyVideos(prev => prev.filter(video => video._id !== videoId));

        const toastId = toast.loading("Deleting video...");
        try {
            await axiosClient.delete(`/videos/${videoId}`);
            toast.success("Video deleted successfully.", { id: toastId });
        } catch (error) {
            console.error("Video deletion failed:", error);
            toast.error(error.response?.data?.message || "Failed to delete video.", { id: toastId });
            // Revert the UI state on failure
            setMyVideos(originalVideos);
        } finally {
            setVideoToDeleteId(null);
        }
    };

    // Handles navigation to the Edit Video page (Fix for button not working)
    const handleEditVideo = (videoId) => {
        navigate(`/edit-video/${videoId}`); // This should work now that window.confirm is gone.
    };
    
    // --- Render Logic ---

    if (loading) return <div className="text-center p-8 text-lg font-medium text-gray-700 dark:text-gray-300">Loading your content...</div>;
    if (error) return <div className="text-center text-red-500 p-8 bg-red-100 rounded-lg max-w-lg mx-auto mt-6">{error}</div>;

    return (
        <div className="p-4 md:p-6 lg:p-8">
            {/* Confirmation Modal */}
            {showDeleteModal && (
                <ConfirmationModal 
                    title="Confirm Deletion"
                    message="Are you sure you want to permanently delete this video? This action cannot be undone."
                    onConfirm={handleDeleteVideo}
                    onCancel={() => setShowDeleteModal(false)}
                />
            )}

            <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Creator Dashboard</h1>
                {/* Upload Video Button */}
                <Link to="/upload-video" className="bg-red-600 text-white font-bold py-2 px-4 rounded-md shadow-lg hover:bg-red-700 transition-colors">
                    Upload Video
                </Link>
            </div>
            
            <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700 mb-6">
                <button 
                    onClick={() => setActiveTab('content')}
                    className={`py-2 px-4 font-semibold transition-colors ${activeTab === 'content' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'}`}
                >
                    My Content ({myVideos.length})
                </button>
                <button 
                    onClick={() => setActiveTab('analytics')}
                    className={`py-2 px-4 font-semibold transition-colors ${activeTab === 'analytics' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'}`}
                >
                    Analytics
                </button>
            </div>

            <div>
                {activeTab === 'content' && (
                    <MyContent 
                        videos={myVideos} 
                        onEdit={handleEditVideo} 
                        onDelete={confirmDelete} // Use confirmDelete here
                    />
                )}
                {/* AnalyticsDashboard should be correctly imported */}
                {activeTab === 'analytics' && <AnalyticsDashboard />}
            </div>
        </div>
    );
}

export default CreatorDashboard;