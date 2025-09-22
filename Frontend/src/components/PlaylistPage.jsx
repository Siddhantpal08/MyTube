// src/components/PlaylistPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // NEW: Import Link for navigation
import { useAuth } from '../Context/AuthContext'; // NEW: Import useAuth
import axiosClient from '../Api/axiosClient';

function PlaylistPage() {
    const { user } = useAuth(); // NEW: Get the authenticated user from context
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // NEW: State for the create playlist form
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [newPlaylistDescription, setNewPlaylistDescription] = useState('');

    // FIXED: Use the dynamic user ID from the auth context
    const userId = user?._id;

    useEffect(() => {
        const fetchPlaylists = async () => {
            if (!userId) return;
            try {
                setLoading(true);
                const response = await axiosClient.get(`/playlist/user/${userId}`);
                console.log("Playlist Page API Response:", response.data);
                setPlaylists(response.data.data);
                setError(null);
            } catch (err) {
                setError(err.response?.data?.message || "Failed to fetch playlists.");
            } finally {
                setLoading(false);
            }
        };

        fetchPlaylists();
    }, [userId]); // Dependency array now correctly uses the dynamic userId

    // NEW: Handler function to create a new playlist
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
            // Add the new playlist to the state to update the UI instantly
            setPlaylists(prevPlaylists => [response.data.data, ...prevPlaylists]);
            // Clear the form fields
            setNewPlaylistName('');
            setNewPlaylistDescription('');
        } catch (err) {
            alert(err.response?.data?.message || "Failed to create playlist.");
        }
    };

    if (loading) return <div className="text-white text-center p-8">Loading...</div>;
    if (error) return <div className="text-red-500 text-center p-8">Error: {error}</div>;

    return (
        <div className="p-4 md:p-8 text-white">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-4">My Playlists</h1>
                
                {/* NEW: Create Playlist Form */}
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
                            // NEW: Each card is now a clickable link
                            <Link to={`/playlist/${playlist._id}`} key={playlist._id}>
                                <div className="bg-gray-800 p-4 rounded-lg h-full hover:bg-gray-700 transition-colors">
                                    <h2 className="font-bold text-lg">{playlist.name}</h2>
                                    <p className="text-sm text-gray-400 mt-1">{playlist.description}</p>
                                    <p className="text-sm text-gray-400 mt-2">{playlist.totalVideos || 0} videos</p>
                                </div>
                            </Link>
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