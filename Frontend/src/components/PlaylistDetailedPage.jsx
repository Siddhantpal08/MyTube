import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axiosClient from '../Api/axiosClient';
import { useAuth } from '../Context/AuthContext';
import toast from 'react-hot-toast';
import VideoCard from '../components/VideoCard'; // Corrected path

function PlaylistDetailPage() {
    const { playlistId } = useParams();
    const { user } = useAuth();
    const [playlist, setPlaylist] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPlaylistDetails = async () => {
        if (!playlistId) return;
        try {
            setLoading(true);
            const response = await axiosClient.get(`/playlist/${playlistId}`);
            setPlaylist(response.data.data);
        } catch (err) {
            setError("Failed to fetch playlist details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlaylistDetails();
    }, [playlistId]);

    // --- NEW: Check if the current user owns this playlist ---
    const isPlaylistOwner = playlist?.owner?._id === user?._id;

    // --- NEW: Handler to remove a video from the playlist ---
    const handleRemoveVideo = async (videoId) => {
        if (!window.confirm("Are you sure you want to remove this video from the playlist?")) {
            return;
        }
        try {
            await axiosClient.patch(`/playlist/remove/${videoId}/${playlistId}`);
            
            // Update the state locally for an instant UI change
            setPlaylist(prevPlaylist => ({
                ...prevPlaylist,
                videos: prevPlaylist.videos.filter(v => v._id !== videoId),
                totalVideos: prevPlaylist.totalVideos - 1,
            }));

            toast.success("Video removed from playlist");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to remove video.");
        }
    };

    if (loading) return <div className="text-center p-8">Loading Playlist...</div>;
    if (error) return <div className="text-center text-red-500 p-8">{error}</div>;
    if (!playlist) return <div className="text-center p-8">Playlist not found.</div>;

    return (
        <div className="p-4 md:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">{playlist.name}</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">{playlist.description}</p>
                <div className="flex items-center gap-4 mt-4">
                    <img src={playlist.owner.avatar} alt={playlist.owner.username} className="w-10 h-10 rounded-full object-cover"/>
                    <div>
                        <p className="font-semibold">{playlist.owner?.username}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {playlist.totalVideos || 0} videos • {playlist.totalViews || 0} views
                        </p>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {playlist.videos.length > 0 ? (
                    playlist.videos.map(video => (
                        <div key={video._id} className="relative group">
                            <VideoCard video={video} />
                            {isPlaylistOwner && (
                                <button
                                    onClick={() => handleRemoveVideo(video._id)}
                                    className="absolute top-2 right-2 text-white bg-red-600 hover:bg-red-700 rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Remove from playlist"
                                >
                                    &times;
                                </button>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 dark:text-gray-400">This playlist has no videos yet.</p>
                )}
            </div>
        </div>
    );
}

export default PlaylistDetailPage;