import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import axiosClient from '../Api/axiosClient';
import toast from 'react-hot-toast';

function PlaylistPage() {
    const { user } = useAuth();
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for creating a new playlist
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [newPlaylistDescription, setNewPlaylistDescription] = useState('');

    // State for the new edit modal
    const [editingPlaylist, setEditingPlaylist] = useState(null);
    const [updatedName, setUpdatedName] = useState('');
    const [updatedDescription, setUpdatedDescription] = useState('');

    const userId = user?._id;

    useEffect(() => {
        if (!userId) return;
        const fetchPlaylists = async () => {
            try {
                setLoading(true);
                const response = await axiosClient.get(`/playlist/user/${userId}`);
                setPlaylists(response.data.data);
            } catch (err) {
                setError(err.response?.data?.message || "Failed to fetch playlists.");
            } finally {
                setLoading(false);
            }
        };
        fetchPlaylists();
    }, [userId]);

    const handleCreatePlaylist = async (e) => {
        e.preventDefault();
        // ... (your existing create handler)
    };

    const handleDeletePlaylist = async (playlistId) => {
        // ... (your existing delete handler)
    };

    // --- NEW: Handler to open the edit modal ---
    const openEditModal = (playlist) => {
        setEditingPlaylist(playlist);
        setUpdatedName(playlist.name);
        setUpdatedDescription(playlist.description);
    };
    
    // --- NEW: Handler to submit the update ---
    const handleUpdatePlaylist = async (e) => {
        e.preventDefault();
        if (!editingPlaylist) return;

        try {
            const response = await axiosClient.patch(`/playlist/${editingPlaylist._id}`, {
                name: updatedName,
                description: updatedDescription,
            });
            
            // Update the playlist in the local state
            setPlaylists(playlists.map(p => p._id === editingPlaylist._id ? response.data.data : p));
            toast.success("Playlist updated!");
            setEditingPlaylist(null); // Close the modal
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update playlist.");
        }
    };

    if (loading) return <div className="text-white text-center p-8">Loading...</div>;
    if (error) return <div className="text-red-500 text-center p-8">Error: {error}</div>;

    return (
        <div className="p-4 md:p-8 text-white">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-4">My Playlists</h1>
                
                {/* --- Your existing 'Create Playlist' form --- */}
                
                {/* --- NEW: Edit Playlist Modal --- */}
                {editingPlaylist && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                        <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
                            <h2 className="text-xl font-semibold mb-4">Edit Playlist</h2>
                            <form onSubmit={handleUpdatePlaylist} className="space-y-4">
                                <input type="text" value={updatedName} onChange={(e) => setUpdatedName(e.target.value)} className="w-full p-2 bg-gray-700 rounded-md" />
                                <textarea value={updatedDescription} onChange={(e) => setUpdatedDescription(e.target.value)} className="w-full p-2 bg-gray-700 rounded-md" rows="3"></textarea>
                                <div className="flex justify-end gap-4">
                                    <button type="button" onClick={() => setEditingPlaylist(null)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md">Cancel</button>
                                    <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* --- IMPROVED: Display Existing Playlists --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {playlists.length > 0 ? (
                        playlists.map((playlist) => (
                            <div key={playlist._id} className="relative group bg-gray-800 rounded-lg overflow-hidden">
                                <Link to={`/playlist/${playlist._id}`}>
                                    <div className="w-full aspect-video bg-gray-700">
                                        {playlist.thumbnail ? (
                                            <img src={playlist.thumbnail} alt={playlist.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h2 className="font-bold text-lg truncate">{playlist.name}</h2>
                                        <p className="text-sm text-gray-400 mt-1 truncate">{playlist.description}</p>
                                        <p className="text-sm text-gray-400 mt-2">{playlist.totalVideos || 0} videos</p>
                                    </div>
                                </Link>
                                
                                {/* --- NEW: Hover Actions (Edit & Delete) --- */}
                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditModal(playlist); }} className="text-xs bg-gray-700 hover:bg-gray-600 text-white font-semibold py-1 px-3 rounded-full">Edit</button>
                                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeletePlaylist(playlist._id); }} className="text-xs bg-gray-700 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-full">Delete</button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="col-span-3 text-center text-gray-400">No playlists found. Create one above!</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PlaylistPage;