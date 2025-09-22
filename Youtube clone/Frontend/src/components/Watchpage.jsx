// src/components/WatchPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext'; // Corrected import path casing
import axiosClient from '../Api/axiosClient'; // Corrected import path casing
import SaveToPlaylistModal from './SaveToPlaylistModal';
import CommentsSection from './CommentSection'; // Corrected to plural for consistency
import ReactPlayer from 'react-player';
import { formatCompactNumber, placeholderAvatar } from '../utils/formatters';


// --- Helper Functions & Components (defined outside for performance) ---

const isMongoId = (id) => id && /^[0-9a-fA-F]{24}$/.test(id);

const RecommendedVideoCard = ({ video }) => {
    const videoLink = video._id ? `/watch/${video._id}` : `/watch/${video.videoId}`;
    return (
        <Link to={videoLink} className="flex items-start gap-2">
            <img src={video.thumbnail} alt={video.title} className="w-40 h-24 object-cover rounded-lg flex-shrink-0 bg-gray-700" />
            <div>
                <h3 className="font-bold text-sm text-white line-clamp-2">{video.title}</h3>
                <p className="text-xs text-gray-400">{video.owner?.username || video.channelTitle}</p>
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

    useEffect(() => {
        const fetchAllData = async () => {
            if (!videoId) return;
            window.scrollTo(0, 0); // Scroll to top on new video load   
            setLoading(true);
            setError(null);
            try {
                let fetchedVideo;
                const isInternal = isMongoId(videoId);
                setIsExternalVideo(!isInternal);

                const videoRes = await axiosClient.get(isInternal ? `/videos/${videoId}` : `/youtube/video/${videoId}`);
                fetchedVideo = videoRes.data.data;
                setVideo(fetchedVideo);
                setLikesCount(fetchedVideo.views || 0);
                setSubscribersCount(fetchedVideo.subscribersCount || 0);

                if (isInternal && fetchedVideo?.owner?._id && isAuthenticated) {
                    const [subRes, likeRes] = await Promise.all([
                        axiosClient.get(`/subscriptions/c/${fetchedVideo.owner._id}`),
                        axiosClient.get(`/likes/video/${videoId}`)
                    ]);
                    setIsSubscribed(subRes.data.data.isSubscribed);
                    setSubscribersCount(subRes.data.data.subscribersCount);
                    setIsLiked(likeRes.data.data.isLiked);
                    setLikesCount(likeRes.data.data.likesCount);
                } else if (!isAuthenticated) {
                    // Reset status for logged-out users
                    setIsLiked(false);
                    setIsSubscribed(false);
                }

                const recommendedVideosRes = await Promise.allSettled([
                    axiosClient.get('/videos?limit=10'), // A few from your DB
                    axiosClient.get(`/youtube/search?query=${fetchedVideo.title || 'popular videos'}&maxResults=10`) // A few from YouTube related to current video
                ]);
                
                let combinedRecommendations = [];
                if (recommendedVideosRes[0].status === 'fulfilled') {
                    combinedRecommendations = [...combinedRecommendations, ...(recommendedVideosRes[0].value.data.data.docs || [])];
                }
                if (recommendedVideosRes[1].status === 'fulfilled') {
                    combinedRecommendations = [...combinedRecommendations, ...(recommendedVideosRes[1].value.data.data.videos || [])];
                }
                
                const uniqueRecommendations = Array.from(new Set(combinedRecommendations.map(v => v._id || v.videoId)))
                    .map(id => combinedRecommendations.find(v => (v._id || v.videoId) === id))
                    .filter(v => (v._id || v.videoId) !== videoId)
                    .sort(() => 0.5 - Math.random());
                
                setRecommendedVideos(uniqueRecommendations.slice(0, 10));
                
            } catch (err) {
                setError("Could not fetch video details.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, [videoId]);

    const handleSubscriptionToggle = async () => {
        if (!isAuthenticated) return navigate('/login', { state: { from: location } });
        const originalState = isSubscribed;
        setIsSubscribed(prev => !prev);
        setSubscribersCount(p => originalState ? p - 1 : p + 1);
        try {
            await axiosClient.post(`/subscriptions/c/${video.owner._id}`);
        } catch {
            setIsSubscribed(originalState);
            setSubscribersCount(p => originalState ? p - 1 : p + 1);
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
            setIsLiked(originalState);
            setLikesCount(p => originalState ? p - 1 : p + 1);
        }
    };

    if (loading) return <div className="text-center text-white mt-20 p-8">Loading...</div>;
    if (error) return <div className="text-center text-red-500 mt-20 p-8">{error}</div>;
    if (!video) return <div className="text-center text-white mt-20 p-8">Video not found.</div>;

    const isOwner = isAuthenticated && video?.owner?._id ? video.owner._id === user._id : false;

    return (
        <div className="p-4 md:p-6 lg:p-8">
            {showPlaylistModal && <SaveToPlaylistModal videoId={videoId} onClose={() => setShowPlaylistModal(false)} />}
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:flex-grow">
                    <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                        {isExternalVideo ? (
                            <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${videoId}?autoplay=0&origin=${window.location.origin}`} // Fixed autoplay
                                title={video.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        ) : (
                            // FIXED: Removed autoplay
                            <video key={video.videofile} src={video.videofile} controls className="w-full h-full" />
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-white mt-4">{video.title}</h1>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mt-4">
                        <div className="flex items-center mb-4 md:mb-0">
                            <img src={video.owner?.avatar || placeholderAvatar} alt={video.owner?.username} className="w-12 h-12 rounded-full bg-gray-700" />
                            <div className="ml-4">
                                <p className="font-semibold text-white">{video.owner?.username}</p>
                                <p className="text-sm text-gray-400">{formatCompactNumber(subscribersCount)} subscribers</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button disabled={isExternalVideo} onClick={handleLikeToggle} className={`flex items-center gap-2 font-bold py-2 px-4 rounded-full transition-colors duration-200 ${isLiked ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333V17a1 1 0 001 1h8a1 1 0 001-1v-6.667a2.5 2.5 0 01-1.667-2.425V6.5a2.5 2.5 0 00-5 0v1.408a2.5 2.5 0 01-1.667 2.425z" /></svg>
                                {formatCompactNumber(likesCount)}
                            </button>
                            <button disabled={isExternalVideo} onClick={() => setShowPlaylistModal(true)} className="bg-gray-700 hover:bg-gray-600 font-bold py-2 px-4 rounded-full disabled:opacity-50 disabled:cursor-not-allowed">💾 Save</button>
                            {/* FIXED: This ensures the button appears if logged in AND not owner */}
                            {!isOwner && <button disabled={isExternalVideo} onClick={handleSubscriptionToggle} className={`font-bold py-2 px-5 rounded-full transition-colors duration-200 ${isSubscribed ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-700'} disabled:opacity-50 disabled:cursor-not-allowed`}>{isSubscribed ? 'Subscribed' : 'Subscribe'}</button>}
                        </div>
                    </div>
                    <div className="mt-4 bg-gray-800 p-4 rounded-lg">
                        <p className={`text-white whitespace-pre-wrap text-sm ${!isDescriptionExpanded && 'line-clamp-3'}`}>{video.description}</p>
                        <button onClick={() => setIsDescriptionExpanded(prev => !prev)} className="text-indigo-400 font-semibold mt-2 text-sm">{isDescriptionExpanded ? 'Show less' : 'Show more'}</button>
                    </div>
                    <CommentsSection videoId={videoId} isExternal={isExternalVideo} />
                </div>
                <div className="w-full lg:w-96 lg:flex-shrink-0">
                    <h2 className="text-xl font-bold text-white mb-4">Up Next</h2>
                    <div className="space-y-4">
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