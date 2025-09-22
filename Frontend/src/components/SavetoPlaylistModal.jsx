// src/components/SaveToPlaylistModal.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../Api/axiosClient';
import toast from 'react-hot-toast';

function SaveToPlaylistModal({ videoId, onClose }) {
    const { user } = useAuth();
    const [playlists, setPlaylists] = useState([]);

    useEffect(() => {
        if (!user?._id || !videoId) return;
        
        // MODIFIED: Send the videoId as a query parameter to the backend
        axiosClient.get(`/playlist/user/${user._id}?videoId=${videoId}`)
            .then(response => {
                setPlaylists(response.data.data);
            });
    }, [user?._id, videoId]);

    // NEW: A single handler for both adding and removing
    const handleToggleVideoInPlaylist = async (playlistId, isAlreadyAdded) => {
        const action = isAlreadyAdded ? 'remove' : 'add';
        const toastId = toast.loading(`${action === 'add' ? 'Adding' : 'Removing'} video...`);

        try {
            await axiosClient.patch(`/playlist/${action}/${videoId}/${playlistId}`);
            
            // Optimistically update the UI for instant feedback
            setPlaylists(prevPlaylists =>
                prevPlaylists.map(p =>
                    p._id === playlistId ? { ...p, containsCurrentVideo: !isAlreadyAdded } : p
                )
            );

            toast.success(`Video ${action === 'add' ? 'added' : 'removed'} successfully!`, { id: toastId });
        } catch (err) {
            const errorMessage = err.response?.data?.message || `Failed to ${action} video.`;
            toast.error(errorMessage, { id: toastId });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-sm">
                <h2 className="text-xl font-bold mb-4">Save to...</h2>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {playlists.map(playlist => (
                        <div key={playlist._id} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                            <span>{playlist.name}</span>
                            
                            {/* MODIFIED: Conditional button text, style, and action */}
                            <button 
                                onClick={() => handleToggleVideoInPlaylist(playlist._id, playlist.containsCurrentVideo)}
                                className={`px-3 py-1 rounded font-semibold ${
                                    playlist.containsCurrentVideo 
                                    ? 'bg-gray-500 hover:bg-gray-400' 
                                    : 'bg-indigo-600 hover:bg-indigo-500'
                                }`}
                            >
                                {playlist.containsCurrentVideo ? 'Remove' : 'Add'}
                            </button>
                        </div>
                    ))}
                </div>
                <button onClick={onClose} className="mt-4 w-full bg-gray-600 py-2 rounded">Close</button>
            </div>
        </div>
    );
}

export default SaveToPlaylistModal;