import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosClient from '../Api/axiosClient';
import VideoCard from '../components/VideoCard';
import SkeletonCard from '../components/SkeletonCard';

function SearchResults() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('search_query');

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSearchResults = async () => {
            if (!query) return;
            setLoading(true);
            setError(null);
            try {
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
    }, [query]);

    if (loading) {
        return (
            <div className="p-4">
                <div className="h-8 w-1/2 rounded animate-pulse mb-6 bg-gray-200 dark:bg-gray-700"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            </div>
        );
    }

    if (error) return <div className="text-center text-red-500 p-8 text-lg">{error}</div>;

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6 border-b pb-3 border-gray-200 dark:border-gray-700">
                Results for: <span className="font-normal italic">"{query}"</span>
            </h1>
            {results.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
                    {results.map((video) => (
                        <VideoCard key={video.videoId} video={video} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                    <h2 className="text-xl font-semibold">No results found for "{query}"</h2>
                    <p className="mt-2 text-sm">Try a different search term.</p>
                </div>
            )}
        </div>
    );
}

export default SearchResults;