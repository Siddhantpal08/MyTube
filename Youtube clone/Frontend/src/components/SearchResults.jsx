// src/components/SearchResults.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axiosClient from '../Api/axiosClient';
import VideoCard from './VideoCard'; // Your hybrid VideoCard
import SkeletonCard from './SkeletonCard'; // The loading skeleton

function SearchResults() {
    const { searchQuery } = useParams();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSearchResults = async () => {
            if (!searchQuery) return;
            try {
                setLoading(true);
                // This calls your backend proxy
                const response = await axiosClient.get(`/youtube/search?query=${searchQuery}`);
                
                // The YouTube proxy sends back a simplified array directly
                setResults(response.data.data.videos || []);
                setError(null);
            } catch (err) {
                setError("Failed to fetch search results.");
                console.error("Search error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSearchResults();
    }, [searchQuery]); // Re-runs search if the query in the URL changes

    if (loading) {
        return (
             <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
        )
    }

    if (error) return <div className="text-center text-red-500 p-8">{error}</div>;

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold text-white mb-6">
                Search Results for: <span className="text-indigo-400">{searchQuery}</span>
            </h1>
            {results.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {/* Your hybrid VideoCard can now handle the YouTube data */}
                    {results.map((video) => (
                        <VideoCard key={video.videoId} video={video} />
                    ))}
                </div>
            ) : (
                <div className="text-center text-gray-400 p-8">
                    <p>No results found for "{searchQuery}".</p>
                    <p className="text-sm">Try checking your backend's YouTube API Key or Quota.</p>
                </div>
            )}
        </div>
    );
}

export default SearchResults;