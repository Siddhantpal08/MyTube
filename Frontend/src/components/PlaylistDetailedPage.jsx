// src/components/PlaylistDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axiosClient from '../Api/axiosClient';
import VideoCard from './VideoCard'; // We can reuse the VideoCard!

function PlaylistDetailPage() {
    const { playlistId } = useParams();
    const [playlist, setPlaylist] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!playlistId) return;
        const fetchPlaylistDetails = async () => {
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
        fetchPlaylistDetails();
    }, [playlistId]);

    if (loading) return <div className="text-white text-center p-8">Loading Playlist...</div>;
    if (error) return <div className="text-red-500 text-center p-8">{error}</div>;
    if (!playlist) return <div className="text-center text-white p-8">Playlist not found.</div>;

    return (
        <div className="p-4 md:p-8 text-white">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">{playlist.name}</h1>
                <p className="text-gray-400 mt-2">{playlist.description}</p>
                <p className="text-sm text-gray-400 mt-1">Created by {playlist.owner?.username} • {playlist.videos?.length || 0} videos</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {playlist.videos.length > 0 ? (
                    playlist.videos.map(video => <VideoCard key={video._id} video={video} />)
                ) : (
                    <p>This playlist has no videos yet.</p>
                )}
            </div>
        </div>
    );
}

export default PlaylistDetailPage;