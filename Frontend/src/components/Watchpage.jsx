import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import axiosClient from '../Api/axiosClient';
import { timeSince, formatCompactNumber, placeholderAvatar } from '../utils/formatters';
import ReactPlayer from 'react-player/youtube'; // Use ReactPlayer for a better experience

import SaveToPlaylistModal from './SavetoPlaylistModal';
import CommentsSection from './CommentSection';

// --- Helper Functions & Sub-Components ---

// Checks if an ID is a valid MongoDB ObjectId
const isMongoId = (id) => id && /^[0-9a-fA-F]{24}$/.test(id);

// A small card for the "Up Next" recommendations list
const RecommendedVideoCard = ({ video }) => {
    const videoLink = `/watch/${video._id || video.videoId}`;
    return (
        <Link to={videoLink} className="flex items-start gap-3 group">
            <div className="w-40 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-700">
                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
            </div>
            <div>
                <h3 className="font-semibold text-sm text-white line-clamp-2 group-hover:text-red-400">{video.title}</h3>
                <p className="text-xs text-gray-400 mt-1">{video.owner?.username || video.channelTitle}</p>
                <p className="text-xs text-gray-400">{formatCompactNumber(video.views || 0)} views</p>
            </div>
        </Link>
    );
};

// --- Main WatchPage Component ---
function WatchPage() {
    const { videoId } = useParams();
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // State management for video data, UI, and interactions
    const [video, setVideo] = useState(null);
    const [isExternalVideo, setIsExternalVideo] = useState(false);
    const [recommendedVideos, setRecommendedVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscribersCount, setSubscribersCount] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [showPlaylistModal, setShowPlaylistModal] = useState(false);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    // Main data fetching effect that runs when the videoId in the URL changes
    useEffect(() => {
        const fetchAllData = async () => {
            if (!videoId) return;
            window.scrollTo(0, 0);
            setLoading(true);
            setError(null);

            try {
                const isInternal = isMongoId(videoId);
                setIsExternalVideo(!isInternal);

                // Fetch the main video details from the correct backend endpoint
                const videoRes = await axiosClient.get(isInternal ? `/videos/${videoId}` : `/youtube/video/${videoId}`);
                const fetchedVideo = videoRes.data.data;
                setVideo(fetchedVideo);
                
                // Set initial counts from the fetched data
                setLikesCount(fetchedVideo.likes || 0);
                setSubscribersCount(fetchedVideo.owner?.subscribers || 0);

                // If it's an internal video and the user is logged in, fetch their specific status (liked/subscribed)
                if (isInternal && fetchedVideo?.owner?._id && isAuthenticated) {
                    const [subRes, likeRes] = await Promise.all([
                        axiosClient.get(`/subscriptions/c/${fetchedVideo.owner._id}`),
                        axiosClient.get(`/likes/video/${videoId}`)
                    ]);
                    setIsSubscribed(subRes.data.data.isSubscribed);
                    setSubscribersCount(subRes.data.data.subscribersCount);
                    setIsLiked(likeRes.data.data.isLiked);
                    setLikesCount(likeRes.data.data.likesCount);
                } else {
                    setIsLiked(false);
                    setIsSubscribed(false);
                }

                // Fetch a mix of recommended videos from your database and YouTube for a dynamic list
                const recommendedRes = await axiosClient.get(`/youtube/search?query=${encodeURIComponent(fetchedVideo.title)}&maxResults=10`);
                setRecommendedVideos(recommendedRes.data.data.videos.filter(v => v.videoId !== videoId));
                
            } catch (err) {
                setError("Could not fetch video details. It may have been removed or the API limit was reached.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, [videoId, isAuthenticated]);

    // Optimistic UI handlers for instant feedback
    const handleSubscriptionToggle = async () => {
        if (!isAuthenticated) return navigate('/login', { state: { from: location } });
        const originalState = isSubscribed;
        setIsSubscribed(prev => !prev);
        setSubscribersCount(p => originalState ? p - 1 : p + 1);
        try {
            await axiosClient.post(`/subscriptions/c/${video.owner._id}`);
        } catch {
            setIsSubscribed(originalState); // Revert on failure
            setSubscribersCount(p => originalState ? p + 1 : p - 1);
        }
    };
    
    const handleLikeToggle = async () => {
        if (!isAuthenticated) return navigate('/login', { state: { from: location } });
        const originalState = isLiked;
        setIsLiked(prev => !prev);
        setLikesCount(p => originalState ? p - 1 : p + 1);
        try {
            await axiosClient.post(`/likes/toggle/v/${videoId}`);
        } catch {
            setIsLiked(originalState); // Revert on failure
            setLikesCount(p => originalState ? p + 1 : p - 1);
        }
    };

    if (loading) return <div className="text-center text-white p-8">Loading Video...</div>;
    if (error) return <div className="text-center text-red-500 p-8">{error}</div>;
    if (!video) return <div className="text-center text-white p-8">Video not found.</div>;

    const isOwner = isAuthenticated && video?.owner?._id === user?._id;

    return (
        <div className="p-4 md:p-6 lg:p-8">
            {showPlaylistModal && <SaveToPlaylistModal videoId={videoId} onClose={() => setShowPlaylistModal(false)} />}
            
            <div className="flex flex-col lg:flex-row gap-8">
                {/* --- Main Content (Left Column) --- */}
                <div className="w-full lg:flex-grow">
                    <div className="aspect-video w-full bg-black rounded-lg overflow-hidden shadow-2xl">
                        {isExternalVideo ? (
                            <ReactPlayer url={`https://www.youtube.com/watch?v=${videoId}`} width="100%" height="100%" controls playing />
                        ) : (
                            <video key={video.videofile} src={video.videofile} controls className="w-full h-full" />
                        )}
                    </div>

                    <h1 className="text-2xl font-bold text-white mt-4">{video.title}</h1>
                    
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mt-4">
                        <div className="flex items-center mb-4 md:mb-0">
                            <img src={video.owner?.avatar || placeholderAvatar} alt={video.owner?.username} className="w-12 h-12 rounded-full bg-gray-700" />
                            <div className="ml-4">
                                <p className="font-semibold text-white text-lg">{video.owner?.username || video.channelTitle}</p>
                                <p className="text-sm text-gray-400">{formatCompactNumber(subscribersCount)} subscribers</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button disabled={isExternalVideo} onClick={handleLikeToggle} className={`flex items-center gap-2 font-bold py-2 px-4 rounded-full transition-colors duration-200 ${isLiked ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333V17a1 1 0 001 1h8a1 1 0 001-1v-6.667a2.5 2.5 0 01-1.667-2.425V6.5a2.5 2.5 0 00-5 0v1.408a2.5 2.5 0 01-1.667 2.425z" /></svg>
                                {formatCompactNumber(likesCount)}
                            </button>
                            <button disabled={isExternalVideo} onClick={() => setShowPlaylistModal(true)} className="bg-gray-700 hover:bg-gray-600 font-bold py-2 px-4 rounded-full disabled:opacity-50 disabled:cursor-not-allowed">💾 Save</button>
                            {!isOwner && <button disabled={isExternalVideo} onClick={handleSubscriptionToggle} className={`font-bold py-2 px-5 rounded-full transition-colors duration-200 ${isSubscribed ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-700'} disabled:opacity-50 disabled:cursor-not-allowed`}>{isSubscribed ? 'Subscribed' : 'Subscribe'}</button>}
                        </div>
                    </div>
                    
                    <div className="mt-4 bg-gray-800 p-4 rounded-lg">
                        <p className="font-semibold text-white text-sm mb-1">{formatCompactNumber(video.views || 0)} views • {timeSince(video.createdAt || video.publishTime)}</p>
                        <p className={`text-gray-300 whitespace-pre-wrap text-sm ${!isDescriptionExpanded && 'line-clamp-3'}`}>{video.description}</p>
                        <button onClick={() => setIsDescriptionExpanded(prev => !prev)} className="text-red-400 font-semibold mt-2 text-sm">{isDescriptionExpanded ? 'Show less' : 'Show more'}</button>
                    </div>

                    <CommentsSection videoId={videoId} isExternal={isExternalVideo} />
                </div>
                
                {/* --- Recommendations (Right Column) --- */}
                <div className="w-full lg:w-96 lg:flex-shrink-0">
                    <h2 className="text-xl font-bold text-white mb-4">Up Next</h2>
                    <div className="space-y-3">
                        {recommendedVideos.length > 0 ? (
                            recommendedVideos.map(recVideo => <RecommendedVideoCard key={recVideo._id || recVideo.videoId} video={recVideo} />)
                        ) : (<p className="text-gray-400 text-sm">No recommendations found.</p>)}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default WatchPage;