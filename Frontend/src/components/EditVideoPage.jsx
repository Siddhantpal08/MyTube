import React, { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext'; // FIX: Adjusted path casing
import axiosClient from '../Api/axiosClient'; // FIX: Adjusted path casing
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

function EditVideoPage() {
    // 1. Hook Initialization
    const { videoId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // 2. State Management
    const [formData, setFormData] = useState({
        title: '',
        description: '',
    });
    const [loading, setLoading] = useState(true);
    const [originalTitle, setOriginalTitle] = useState(''); // Used for change detection
    const [originalDescription, setOriginalDescription] = useState(''); // Used for change detection
    const [originalThumbnail, setOriginalThumbnail] = useState('');
    const [newThumbnailFile, setNewThumbnailFile] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState(null);

    // --- Data Fetching Effect ---
    useEffect(() => {
        const fetchVideo = async () => {
            // User check is crucial here, but often handled by a protected route wrapper.
            if (!user?._id) return; 

            try {
                const response = await axiosClient.get(`/videos/${videoId}`);
                const video = response.data.data;

                // Authorization check: Ensure the logged-in user is the video owner
                if (user?._id !== video.owner?._id) {
                    toast.error("You are not authorized to edit this video.");
                    // Use replace to prevent back navigation loop
                    navigate("/dashboard", { replace: true }); 
                    return;
                }

                // Set initial state from fetched data
                setFormData({
                    title: video.title,
                    description: video.description,
                });
                setOriginalTitle(video.title);
                setOriginalDescription(video.description);
                setOriginalThumbnail(video.thumbnail);
                setError(null);
            } catch (error) {
                setError("Could not load the post for editing.");
                toast.error("Could not load the video for editing.");
                navigate("/dashboard", { replace: true });
            } finally {
                setLoading(false);
            }
        };
        fetchVideo();
    }, [videoId, navigate, user?._id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setNewThumbnailFile(e.target.files[0]);
    };

    // --- Submission Handler ---
    const handleUpdate = async (e) => {
        e.preventDefault();
        
        if (!formData.title.trim()) {
            return toast.error("Title cannot be empty.");
        }

        const isTitleChanged = formData.title !== originalTitle;
        const isDescriptionChanged = formData.description !== originalDescription;
        const isFileChanged = newThumbnailFile !== null;

        if (!isTitleChanged && !isDescriptionChanged && !isFileChanged) {
            return toast("No changes were made to save.");
        }

        setIsUpdating(true);
        const toastId = toast.loading("Saving changes...");

        try {
            // Use FormData for sending text data and files together
            const data = new FormData();
            
            if (isTitleChanged) data.append('title', formData.title);
            if (isDescriptionChanged) data.append('description', formData.description);
            if (newThumbnailFile) {
                data.append('thumbnail', newThumbnailFile); // Send the new thumbnail file
            }

            // Patch request to update video metadata and optionally the thumbnail file
            await axiosClient.patch(`/videos/${videoId}`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            toast.success("Video updated successfully!", { id: toastId });
            navigate('/dashboard', { replace: true }); // Redirect back to the dashboard/content tab
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update video.", { id: toastId });
            console.error("Video update failed:", error);
        } finally {
            setIsUpdating(false);
        }
    };

    // --- Render Logic ---

    if (loading) {
        return <div className="text-center p-8 text-lg font-medium text-gray-700 dark:text-gray-300">Loading video data...</div>;
    }
    if (error) {
        return <div className="text-center text-red-500 p-8 bg-red-100 dark:bg-red-900 rounded-lg max-w-lg mx-auto mt-6">{error}</div>;
    }

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Edit Video Metadata</h1>
            
            <form onSubmit={handleUpdate} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 space-y-6">
                
                {/* Current Thumbnail Preview */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Thumbnail</label>
                    <img 
                        // Show new file preview, otherwise show original URL
                        src={newThumbnailFile ? URL.createObjectURL(newThumbnailFile) : originalThumbnail} 
                        alt="Current Thumbnail" 
                        className="w-full h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                    />
                </div>

                {/* New Thumbnail Upload */}
                <div>
                    <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Change Thumbnail (Optional)</label>
                    <input
                        id="thumbnail"
                        name="thumbnail"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="w-full text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 p-2 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-100 file:text-red-600 hover:file:bg-red-200"
                    />
                </div>

                {/* Title Field */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                    <input
                        id="title"
                        name="title"
                        type="text"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-red-500 focus:border-red-500"
                    />
                </div>

                {/* Description Field */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="4"
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-red-500 focus:border-red-500 resize-none"
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-2">
                    <button 
                        type="button" 
                        onClick={() => navigate('/dashboard')} 
                        className="font-semibold px-6 py-2 rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white transition-colors"
                        disabled={isUpdating}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        className="font-semibold px-6 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white shadow-md transition-colors disabled:opacity-60"
                        disabled={isUpdating || !formData.title.trim()}
                    >
                        {isUpdating ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default EditVideoPage;