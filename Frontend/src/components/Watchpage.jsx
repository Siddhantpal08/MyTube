import React, { useEffect, useState, useCallback } from 'react'; // Added useCallback
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'; // Ensure Link is imported
import { useAuth } from '../Context/AuthContext';
import axiosClient from '../Api/axiosClient';
import { timeSince, formatCompactNumber, placeholderAvatar } from '../utils/formatters';
import ReactPlayer from 'react-player/youtube'; // Using specific YouTube player for better control

import SaveToPlaylistModal from './SavetoPlaylistModal'; // Assuming this component exists
import CommentsSection from './CommentSection'; // Assuming this component exists and is final

// --- Helper Functions & Sub-Components (defined outside for performance) ---

// Checks if an ID is a valid MongoDB ObjectId
const isMongoId = (id) => id && /^[0-9a-fA-F]{24}$/.test(id);

// A small card for the "Up Next" recommendations list
const RecommendedVideoCard = ({ video }) => {
    // Ensure correct key for internal/external videos
    const videoLink = `/watch/${video._id || video.videoId}`;
    const channelName = video.owner?.username || video.channelTitle;

    return (
        <Link to={videoLink} className="flex items-start gap-3 group">
            <div className="w-40 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-700">
                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
            </div>
            <div>
                <h3 className="font-semibold text-sm text-black dark:text-white line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400">{video.title}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{channelName}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{formatCompactNumber(video.views || 0)} views</p>
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
            window.scrollTo(0, 0); // Scroll to top on new video load
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
                    // Reset status for external videos or logged-out users
                    setIsLiked(false);
                    setIsSubscribed(false);
                }

                // Fetch a mix of recommended videos from your database and YouTube for a dynamic list
                const recommendedRes = await axiosClient.get(`/youtube/search?query=${encodeURIComponent(fetchedVideo.title || 'popular videos')}&maxResults=10`);
                setRecommendedVideos(recommendedRes.data.data.videos.filter(v => (v._id || v.videoId) !== videoId));
                
            } catch (err) {
                setError("Could not fetch video details. It may have been removed or the API limit was reached.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, [videoId, isAuthenticated, user?._id]); // Add user?._id to re-fetch on login/logout

    // Optimistic UI handlers for instant feedback
    const handleSubscriptionToggle = useCallback(async () => {
        if (!isAuthenticated) return navigate('/login', { state: { from: location } });
        const originalState = isSubscribed;
        setIsSubscribed(prev => !prev);
        setSubscribersCount(p => originalState ? p - 1 : p + 1);
        try {
            await axiosClient.post(`/subscriptions/c/${video.owner._id}`);
        } catch (error) {
            // Assuming 'toast' is available globally or imported
            // toast.error("Failed to toggle subscription."); 
            setIsSubscribed(originalState); // Revert on failure
            setSubscribersCount(p => originalState ? p + 1 : p - 1);
        }
    }, [isAuthenticated, isSubscribed, video?.owner?._id, navigate, location]);
    
    const handleLikeToggle = useCallback(async () => {
        if (!isAuthenticated) return navigate('/login', { state: { from: location } });
        const originalState = isLiked;
        setIsLiked(prev => !prev);
        setLikesCount(p => originalState ? p - 1 : p + 1);
        try {
            await axiosClient.post(`/likes/toggle/v/${videoId}`);
        } catch (error) {
            // Assuming 'toast' is available globally or imported
            // toast.error("Failed to toggle like.");
            setIsLiked(originalState); // Revert on failure
            setLikesCount(p => originalState ? p + 1 : p - 1);
        }
    }, [isAuthenticated, isLiked, videoId, navigate, location]);

    if (loading) return <div className="text-center text-black dark:text-white p-8">Loading Video...</div>;
    if (error) return <div className="text-center text-red-600 dark:text-red-500 p-8">{error}</div>;
    if (!video) return <div className="text-center text-black dark:text-white p-8">Video not found.</div>;

    const isOwner = isAuthenticated && video?.owner?._id === user?._id;

    // --- THE FIXES FOR VIDEO SOURCE & PLAYER ---
    // Ensure Cloudinary video URLs are always HTTPS
    const videoSourceUrl = video.videofile && video.videofile.startsWith('http://') 
        ? video.videofile.replace('http://', 'https://') 
        : video.videofile;
    
    const youtubePlayerUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const reactPlayerConfig = {
        youtube: {
            playerVars: {
                // IMPORTANT: origin is required for postMessage security
                origin: window.location.origin, 
                // modestbranding: 1, // Optional: for less YouTube branding
                // rel: 0 // Optional: no related videos at the end
            }
        }
    };
    // --- END FIXES ---

    return (
        <div className="p-4 md:p-6 lg:p-8 bg-white dark:bg-[#0F0F0F] min-h-screen transition-colors duration-200">
            {showPlaylistModal && <SaveToPlaylistModal videoId={videoId} onClose={() => setShowPlaylistModal(false)} />}
            
            <div className="flex flex-col lg:flex-row gap-8">
                {/* --- Main Content (Left Column) --- */}
                <div className="w-full lg:flex-grow">
                    <div className="aspect-video w-full bg-gray-200 dark:bg-black rounded-lg overflow-hidden shadow-2xl">
                        {isExternalVideo ? (
                            <ReactPlayer url={youtubePlayerUrl} width="100%" height="100%" controls playing={false} config={reactPlayerConfig} />
                        ) : (
                            <video key={video.videofile} src={videoSourceUrl} controls className="w-full h-full" />
                        )}
                    </div>

                    <h1 className="text-2xl font-bold text-black dark:text-white mt-4">{video.title}</h1>
                    
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mt-4">
                        <div className="flex items-center mb-4 md:mb-0">
                            {/* --- Clickable Channel Avatar & Name --- */}
                            <Link to={!isExternalVideo && video.owner?.username ? `/channel/${video.owner.username}` : '#'} className={isExternalVideo ? 'cursor-default' : ''}>
                                <img src={video.owner?.avatar || placeholderAvatar} alt={video.owner?.username || video.channelTitle} className="w-12 h-12 rounded-full object-cover bg-gray-200 dark:bg-gray-700" />
                            </Link>
                            <div className="ml-4">
                                <Link to={!isExternalVideo && video.owner?.username ? `/channel/${video.owner.username}` : '#'} className={isExternalVideo ? 'cursor-default text-black dark:text-white' : 'hover:text-red-600 dark:hover:text-red-400 transition-colors text-black dark:text-white'}>
                                    <p className="font-semibold text-lg">{video.owner?.username || video.channelTitle}</p>
                                </Link>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{formatCompactNumber(subscribersCount)} subscribers</p>
                            </div>
                            {/* --- END FIX --- */}
                        </div>
                        <div className="flex items-center space-x-2">
                            <button disabled={isExternalVideo || !isAuthenticated} onClick={handleLikeToggle} className={`flex items-center gap-2 font-bold py-2 px-4 rounded-full transition-colors duration-200 text-white ${isLiked ? 'bg-red-600' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isLiked ? 'text-white' : 'text-black dark:text-white'}`} viewBox="0 0 20 20" fill="currentColor"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333V17a1 1 0 001 1h8a1 1 0 001-1v-6.667a2.5 2.5 0 01-1.667-2.425V6.5a2.5 2.5 0 00-5 0v1.408a2.5 2.5 0 01-1.667 2.425z" /></svg>
                                <span className={isLiked ? 'text-white' : 'text-black dark:text-white'}>{formatCompactNumber(likesCount)}</span>
                            </button>
                            <button disabled={isExternalVideo || !isAuthenticated} onClick={() => setShowPlaylistModal(true)} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 font-bold py-2 px-4 rounded-full disabled:opacity-50 disabled:cursor-not-allowed text-black dark:text-white transition-colors duration-200">💾 Save</button>
                            {!isOwner && <button disabled={isExternalVideo || !isAuthenticated} onClick={handleSubscriptionToggle} className={`font-bold py-2 px-5 rounded-full transition-colors duration-200 text-white ${isSubscribed ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-700'} disabled:opacity-50 disabled:cursor-not-allowed`}>{isSubscribed ? 'Subscribed' : 'Subscribe'}</button>}
                        </div>
                    </div>
                    
                    <div className="mt-4 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg transition-colors duration-200">
                        <p className="font-semibold text-black dark:text-white text-sm mb-1">{formatCompactNumber(video.views || 0)} views • {timeSince(video.createdAt || video.publishTime)}</p>
                        <p className={`text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm ${!isDescriptionExpanded && 'line-clamp-3'}`}>{video.description}</p>
                        <button onClick={() => setIsDescriptionExpanded(prev => !prev)} className="text-red-600 dark:text-red-400 font-semibold mt-2 text-sm">{isDescriptionExpanded ? 'Show less' : 'Show more'}</button>
                    </div>

                    {/* Comments section */}
                    <CommentsSection videoId={videoId} isExternal={isExternalVideo} />
                </div>
                
                {/* --- Recommendations (Right Column) --- */}
                <div className="w-full lg:w-96 lg:flex-shrink-0">
                    <h2 className="text-xl font-bold text-black dark:text-white mb-4">Up Next</h2>
                    <div className="space-y-3">
                        {recommendedVideos.length > 0 ? (
                            recommendedVideos.map(recVideo => <RecommendedVideoCard key={recVideo._id || recVideo.videoId} video={recVideo} />)
                        ) : (<p className="text-gray-600 dark:text-gray-400 text-sm">No recommendations found.</p>)}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default WatchPage;