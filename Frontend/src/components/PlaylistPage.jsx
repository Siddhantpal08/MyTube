import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import axiosClient from '../Api/axiosClient';

function PlaylistPage() {
    const { user } = useAuth();
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [newPlaylistDescription, setNewPlaylistDescription] = useState('');

    const userId = user?._id;

    useEffect(() => {
        const fetchPlaylists = async () => {
            if (!userId) return;
            try {
                setLoading(true);
                const response = await axiosClient.get(`/playlist/user/${userId}`);
                setPlaylists(response.data.data);
                setError(null);
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
            alert("Playlist name cannot be empty.");
            return;
        }
        try {
            const response = await axiosClient.post('/playlist', {
                name: newPlaylistName,
                description: newPlaylistDescription,
            });
            setPlaylists(prevPlaylists => [response.data.data, ...prevPlaylists]);
            setNewPlaylistName('');
            setNewPlaylistDescription('');
        } catch (err) {
            alert(err.response?.data?.message || "Failed to create playlist.");
        }
    };

    // 🔽 NEW: Handler function to delete a playlist
    const handleDeletePlaylist = async (playlistId) => {
        // Confirm before deleting
        if (!window.confirm("Are you sure you want to delete this playlist?")) {
            return;
        }
        try {
            // Call the delete API endpoint
            await axiosClient.delete(`/playlist/${playlistId}`);
            // Update the state to remove the playlist from the UI
            setPlaylists(prevPlaylists => prevPlaylists.filter(p => p._id !== playlistId));
        } catch (err) {
            alert(err.response?.data?.message || "Failed to delete playlist.");
        }
    };

    if (loading) return <div className="text-white text-center p-8">Loading...</div>;
    if (error) return <div className="text-red-500 text-center p-8">Error: {error}</div>;

    return (
        <div className="p-4 md:p-8 text-white">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-4">My Playlists</h1>
                
                {/* Create Playlist Form */}
                <div className="bg-gray-800 p-4 rounded-lg mb-8">
                    <h2 className="text-xl font-semibold mb-3">Create a New Playlist</h2>
                    <form onSubmit={handleCreatePlaylist} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Playlist Name"
                            value={newPlaylistName}
                            onChange={(e) => setNewPlaylistName(e.target.value)}
                            className="w-full p-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <textarea
                            placeholder="Description"
                            value={newPlaylistDescription}
                            onChange={(e) => setNewPlaylistDescription(e.target.value)}
                            className="w-full p-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            rows="2"
                        ></textarea>
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md">
                            Create Playlist
                        </button>
                    </form>
                </div>

                {/* Display Existing Playlists */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {playlists.length > 0 ? (
                        playlists.map((playlist) => (
                            <div key={playlist._id} className="relative group">
                                <Link to={`/playlist/${playlist._id}`}>
                                    <div className="bg-gray-800 p-4 rounded-lg h-full hover:bg-gray-700 transition-colors">
                                        <h2 className="font-bold text-lg">{playlist.name}</h2>
                                        <p className="text-sm text-gray-400 mt-1">{playlist.description}</p>
                                        <p className="text-sm text-gray-400 mt-2">{playlist.totalVideos || 0} videos</p>
                                    </div>
                                </Link>
                                {/* 🔽 NEW: Delete Button */}
                                <button
                                    onClick={(e) => {
                                        e.preventDefault(); // Prevent navigation
                                        e.stopPropagation(); // Stop event bubbling
                                        handleDeletePlaylist(playlist._id);
                                    }}
                                    className="absolute top-2 right-2 text-white bg-red-600 hover:bg-red-700 rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Delete Playlist"
                                >
                                    &times;
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="col-span-3 text-center text-gray-400">No playlists found. Create your first one above!</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PlaylistPage;