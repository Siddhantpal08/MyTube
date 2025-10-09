import React, { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import axiosClient from '../Api/axiosClient';
import toast from 'react-hot-toast';

function SaveToPlaylistModal({ videoId, onClose }) {
    const { user } = useAuth();
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?._id || !videoId) return;
        
        setLoading(true);
        axiosClient.get(`/playlist/user/${user._id}?videoId=${videoId}`)
            .then(response => {
                setPlaylists(response.data.data);
            })
            .catch(() => toast.error("Could not load playlists."))
            .finally(() => setLoading(false));
    }, [user?._id, videoId]);

    const handleToggleVideoInPlaylist = async (playlistId, isAlreadyAdded) => {
        const action = isAlreadyAdded ? 'remove' : 'add';
        const toastId = toast.loading(`${action === 'add' ? 'Adding' : 'Removing'} video...`);

        try {
            await axiosClient.patch(`/playlist/${action}/${videoId}/${playlistId}`);
            
            setPlaylists(prevPlaylists =>
                prevPlaylists.map(p =>
                    p._id === playlistId ? { ...p, containsCurrentVideo: !isAlreadyAdded } : p
                )
            );

            toast.success(`Video ${action === 'add' ? 'added' : 'removed'}!`, { id: toastId });
        } catch (err) {
            const errorMessage = err.response?.data?.message || `Failed to ${action} video.`;
            toast.error(errorMessage, { id: toastId });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
            <div className="w-full max-w-sm rounded-lg shadow-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold">Save to...</h2>
                </div>
                <div className="p-6 space-y-2 max-h-60 overflow-y-auto">
                    {loading ? (
                        <p className="text-center text-gray-500 dark:text-gray-400">Loading playlists...</p>
                    ) : playlists.length > 0 ? (
                        playlists.map(playlist => (
                            <div key={playlist._id} className="flex justify-between items-center p-2 rounded bg-gray-100 dark:bg-gray-700">
                                <span className="font-medium">{playlist.name}</span>
                                <button 
                                    onClick={() => handleToggleVideoInPlaylist(playlist._id, playlist.containsCurrentVideo)}
                                    className={`px-3 py-1 rounded font-semibold text-white ${
                                        playlist.containsCurrentVideo 
                                        ? 'bg-gray-500 hover:bg-gray-400' 
                                        : 'bg-red-600 hover:bg-red-500'
                                    }`}
                                >
                                    {playlist.containsCurrentVideo ? 'Remove' : 'Add'}
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400">You have no playlists yet.</p>
                    )}
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
                    <button onClick={onClose} className="w-full font-semibold py-2 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SaveToPlaylistModal;