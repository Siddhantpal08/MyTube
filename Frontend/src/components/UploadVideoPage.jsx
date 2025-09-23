// src/pages/UploadVideoPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../Api/axiosClient'; // Corrected path to lowercase 'api'
import toast from 'react-hot-toast';

function UploadVideoPage() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [videoFile, setVideoFile] = useState(null);
    const [thumbnail, setThumbnail] = useState(null);
    const [uploading, setUploading] = useState(false);
    const navigate = useNavigate();

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!title || !description || !videoFile || !thumbnail) {
            return toast.error("All fields are required.");
        }
        setUploading(true);
        const toastId = toast.loading("Uploading video...", {
            style: {
                background: '#333',
                color: '#fff',
            },
        });
        
        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("videoFile", videoFile);
        formData.append("thumbnail", thumbnail);

        try {
            const response = await axiosClient.post('/videos', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    toast.loading(`Uploading: ${percentCompleted}%`, { id: toastId });
                }
            });
            toast.success("Video uploaded successfully!", { id: toastId });
                navigate(`/watch/${response.data.data._id}`); // Navigate to the new video
        } catch (error) {
            console.error("Video upload error:", error);
            toast.error(error.response?.data?.message || "Upload failed. Please try again.", { id: toastId });
        } finally {
            setUploading(false);
        }
    };
    
    return (
        <div className="p-4 max-w-2xl mx-auto text-white bg-gray-900 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-center">Upload a New Video</h1>
            <form onSubmit={handleUpload} className="space-y-6 p-6 bg-gray-800 rounded-lg shadow-lg">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Video Title</label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter video title"
                        className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 focus:ring-red-500 focus:border-red-500 text-white"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows="4"
                        placeholder="Tell viewers about your video..."
                        className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 focus:ring-red-500 focus:border-red-500 text-white"
                        required
                    ></textarea>
                </div>
                <div>
                    <label htmlFor="videoFile" className="block text-sm font-medium text-gray-300 mb-1">Video File</label>
                    <input
                        type="file"
                        id="videoFile"
                        accept="video/*"
                        onChange={(e) => setVideoFile(e.target.files[0])}
                        className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 focus:ring-red-500 focus:border-red-500 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-500 file:text-white hover:file:bg-red-600"
                        required
                    />
                    {videoFile && <p className="text-sm text-gray-400 mt-2">Selected: {videoFile.name}</p>}
                </div>
                <div>
                    <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-300 mb-1">Thumbnail Image</label>
                    <input
                        type="file"
                        id="thumbnail"
                        accept="image/*"
                        onChange={(e) => setThumbnail(e.target.files[0])}
                        className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 focus:ring-red-500 focus:border-red-500 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-500 file:text-white hover:file:bg-red-600"
                        required
                    />
                    {thumbnail && <p className="text-sm text-gray-400 mt-2">Selected: {thumbnail.name}</p>}
                </div>
                <button
                    type="submit"
                    disabled={uploading}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {uploading ? "Uploading..." : "Upload Video"}
                </button>
            </form>
        </div>
    );
}

export default UploadVideoPage;