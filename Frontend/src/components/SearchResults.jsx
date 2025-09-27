import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom'; // 1. Import useSearchParams
import axiosClient from '../Api/axiosClient';
import VideoCard from './VideoCard';
import SkeletonCard from './SkeletonCard';

function SearchResults() {
    const [searchParams] = useSearchParams(); // 2. Use the hook to get URL search params
    const query = searchParams.get('search_query'); // 3. Extract the 'search_query' value

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSearchResults = async () => {
            if (!query) return; // Exit if there's no query
            setLoading(true);
            setError(null);
            try {
                // Use the extracted query to call your backend API
                const response = await axiosClient.get(`/youtube/search?query=${encodeURIComponent(query)}`);
                
                setResults(response.data.data.videos || []);
            } catch (err) {
                setError("Failed to fetch search results.");
                console.error("Search error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSearchResults();
    }, [query]); // 4. Re-run the search whenever the query in the URL changes

    if (loading) {
        return (
            <div className="p-4">
                <div className="h-8 w-1/2 bg-gray-700 rounded animate-pulse mb-6"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            </div>
        );
    }

    if (error) return <div className="text-center text-red-500 p-8 text-lg">{error}</div>;

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-3">
                Results for: <span className="font-normal italic">"{query}"</span>
            </h1>
            {results.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
                    {results.map((video) => (
                        <VideoCard key={video.videoId} video={video} />
                    ))}
                </div>
            ) : (
                <div className="text-center text-gray-400 py-16">
                    <h2 className="text-xl font-semibold">No results found for "{query}"</h2>
                    <p className="mt-2 text-sm">Try a different search term.</p>
                </div>
            )}
        </div>
    );
}

export default SearchResults;