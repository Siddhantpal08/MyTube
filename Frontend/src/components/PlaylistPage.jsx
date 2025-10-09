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

    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [newPlaylistDescription, setNewPlaylistDescription] = useState('');

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
        if (!newPlaylistName.trim()) {
            return toast.error("Playlist name cannot be empty.");
        }
        try {
            const response = await axiosClient.post('/playlist', {
                name: newPlaylistName,
                description: newPlaylistDescription,
            });
            // Add the new playlist to the top for immediate feedback
            setPlaylists(prevPlaylists => [response.data.data, ...prevPlaylists]);
            setNewPlaylistName('');
            setNewPlaylistDescription('');
            toast.success("Playlist created!");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create playlist.");
        }
    };

    const handleDeletePlaylist = async (playlistId) => {
        if (!window.confirm("Are you sure you want to delete this playlist?")) {
            return;
        }
        try {
            await axiosClient.delete(`/playlist/${playlistId}`);
            setPlaylists(prevPlaylists => prevPlaylists.filter(p => p._id !== playlistId));
            toast.success("Playlist deleted");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete playlist.");
        }
    };
    
    const openEditModal = (playlist) => {
        setEditingPlaylist(playlist);
        setUpdatedName(playlist.name);
        setUpdatedDescription(playlist.description);
    };
    
    const handleUpdatePlaylist = async (e) => {
        e.preventDefault();
        if (!editingPlaylist) return;

        try {
            const response = await axiosClient.patch(`/playlist/${editingPlaylist._id}`, {
                name: updatedName,
                description: updatedDescription,
            });
            
            setPlaylists(playlists.map(p => p._id === editingPlaylist._id ? response.data.data : p));
            toast.success("Playlist updated!");
            setEditingPlaylist(null);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update playlist.");
        }
    };

    if (loading) return <div className="text-center p-8">Loading...</div>;
    if (error) return <div className="text-red-500 text-center p-8">Error: {error}</div>;

    return (
        <div className="p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-4">My Playlists</h1>
                
                <div className="p-4 rounded-lg mb-8 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold mb-3">Create a New Playlist</h2>
                    <form onSubmit={handleCreatePlaylist} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Playlist Name"
                            value={newPlaylistName}
                            onChange={(e) => setNewPlaylistName(e.target.value)}
                            className="w-full p-2 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 border border-gray-300 dark:border-gray-600"
                        />
                        <textarea
                            placeholder="Description"
                            value={newPlaylistDescription}
                            onChange={(e) => setNewPlaylistDescription(e.target.value)}
                            className="w-full p-2 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 border border-gray-300 dark:border-gray-600"
                            rows="2"
                        ></textarea>
                        <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md">
                            Create Playlist
                        </button>
                    </form>
                </div>
                
                {editingPlaylist && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                        <div className="p-6 rounded-lg w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-semibold mb-4">Edit Playlist</h2>
                            <form onSubmit={handleUpdatePlaylist} className="space-y-4">
                                <input type="text" value={updatedName} onChange={(e) => setUpdatedName(e.target.value)} className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-700" />
                                <textarea value={updatedDescription} onChange={(e) => setUpdatedDescription(e.target.value)} className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-700" rows="3"></textarea>
                                <div className="flex justify-end gap-4">
                                    <button type="button" onClick={() => setEditingPlaylist(null)} className="font-bold py-2 px-4 rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                                    <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {playlists.length > 0 ? (
                        playlists.map((playlist) => (
                            <div key={playlist._id} className="relative group rounded-lg overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                <Link to={`/playlist/${playlist._id}`}>
                                    <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700">
                                        {playlist.thumbnail ? (
                                            <img src={playlist.thumbnail} alt={playlist.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h2 className="font-bold text-lg truncate">{playlist.name}</h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{playlist.description}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{playlist.totalVideos || 0} videos</p>
                                    </div>
                                </Link>
                                
                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditModal(playlist); }} className="text-xs bg-gray-600 hover:bg-gray-500 text-white font-semibold py-1 px-3 rounded-full">Edit</button>
                                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeletePlaylist(playlist._id); }} className="text-xs bg-red-600 hover:bg-red-500 text-white font-semibold py-1 px-3 rounded-full">Delete</button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="col-span-full text-center text-gray-500 dark:text-gray-400">No playlists found. Create one above!</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PlaylistPage;