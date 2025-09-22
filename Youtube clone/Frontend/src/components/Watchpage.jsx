// src/components/WatchPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../Api/axiosClient';
import SaveToPlaylistModal from './SaveToPlaylistModal';
import CommentsSection from './CommentSection';
import ReactPlayer from 'react-player'; // Use the main import

// --- Helper Functions & Components (defined outside for performance) ---

const isMongoId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

const placeholderAvatar = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2EwYWVjMCI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMTguNzUgMTkuMTI1YTUuMjUgNS4yNSAwIDAgMC0xMC41IDBWMTguNzVjMC0uNDEzLS4wMy0uODI2LS4wODItMS4yMzFsLS43NTQtLjM3N2EuNzUuNzUgMCAwIDAtLjQ5OC44MDVsLjc4NyA0LjcyM2MwIC4zOTYuMzQuNzI2LjczNi43MjZoMTMuMjc0Yy4zOTUgMCAuNzM1LS4zMy43MzYtLjcyNmwzLjE0Ni0xOC44NzhhLjc1Ljc1IDAgMSAwLTEuNDc4LS4yNDhsLTIuMjkyIDEzLjc1MmEuMjUuMjUgMCAwIDEtLjQ4My4wODJsLS44MDgtMi4zMjNjLS4zNi0xLjAzNi0uOTcxLTEuOTg2LTEuNzUtMi44MTRhMy43NSA0LjEyNyAwIDAgMC0zLTEuMjg3aC0xLjVhMy43NSA0LjEyNyAwIDAgMC0zIDEuMjg3Yy0uNzc5LjgyOC0xLjM5IDIuNzU5LTEuNzUgMi44MTRsLS44MDggMi4zMjNhLjI1Ljg0MSAwIDAgMS0uNDgzLS4wODJsLS4zMy0uOTQyYS43NS43NSAwIDAgMC0xLjM5Ni40ODdsLjM1MyAxLjAwNWE1LjI1IDUuMjUgMCAwIDAgMTAuMDI4IDBMMTguNzUgMTkuMTI1WiIgY2xpcC1ydWxlPSJldmVub2RkIiAvPjwvc3ZnPg==`;
const RecommendedVideoCard = ({ video }) => {
    const videoLink = video._id ? `/watch/${video._id}` : `/watch/${video.videoId}`;
    return (
        <Link to={videoLink} className="flex items-start gap-2">
            <img src={video.thumbnail} alt={video.title} className="w-40 h-24 object-cover rounded-lg flex-shrink-0" />
            <div>
                <h3 className="font-bold text-sm text-white line-clamp-2">{video.title}</h3>
                <p className="text-xs text-gray-400">{video.owner?.username || video.channelTitle}</p>
                <p className="text-xs text-gray-400">{video.views} views</p>
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
            setLoading(true);
            try {
                let fetchedVideo;
                const isInternal = isMongoId(videoId);
                setIsExternalVideo(!isInternal);

                if (isInternal) {
                    const videoRes = await axiosClient.get(`/videos/${videoId}`);
                    fetchedVideo = videoRes.data.data;
                    setVideo(fetchedVideo);
                    
                    const [subRes, likeRes] = await Promise.all([
                        axiosClient.get(`/subscriptions/c/${fetchedVideo.owner._id}`),
                        axiosClient.get(`/likes/video/${videoId}`)
                    ]);
                    setIsSubscribed(subRes.data.data.isSubscribed);
                    setSubscribersCount(subRes.data.data.subscribersCount);
                    setIsLiked(likeRes.data.data.isLiked);
                    setLikesCount(likeRes.data.data.likesCount);
                } else {
                    const videoRes = await axiosClient.get(`/youtube/video/${videoId}`);
                    fetchedVideo = videoRes.data.data;
                    setVideo(fetchedVideo);
                    setLikesCount(fetchedVideo.views || 0);
                    // FIXED: Use the correct subscriber count from the API
                    setSubscribersCount(fetchedVideo.subscribersCount || 0);
                }

                const recommendedRes = await axiosClient.get('/videos?limit=10');
                setRecommendedVideos(recommendedRes.data.data.docs.filter(v => v._id !== videoId));
                
            } catch (err) {
                setError("Could not fetch video details.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, [videoId, user?._id]);

    const handleSubscriptionToggle = async () => {
        if (!isAuthenticated) return navigate('/login', { state: { from: location } });
        const newSubscribedState = !isSubscribed;
        setIsSubscribed(newSubscribedState);
        setSubscribersCount(p => newSubscribedState ? p + 1 : p - 1);
        try {
            await axiosClient.post(`/subscriptions/c/${video.owner._id}`);
        } catch (error) {
            setIsSubscribed(!newSubscribedState);
            setSubscribersCount(p => !newSubscribedState ? p + 1 : p - 1);
            console.log(error)
        }
    };
    
    const handleLikeToggle = async () => {
        if (!isAuthenticated) return navigate('/login', { state: { from: location } });
        const newLikedState = !isLiked;
        setIsLiked(newLikedState);
        setLikesCount(p => newLikedState ? p + 1 : p - 1);
        try {
            await axiosClient.post(`/likes/toggle/v/${videoId}`);
        } catch (error) {
            setIsLiked(!newLikedState);
            setLikesCount(p => !newLikedState ? p + 1 : p - 1);
            console.log(error)
        }
    };

    if (loading) return <div className="text-center text-white mt-10">Loading video...</div>;
    if (error) return <div className="text-center text-red-500 mt-10">{error}</div>;
    if (!video) return <div className="text-center text-white mt-10">Video not found.</div>;

    const isOwner = video.owner?._id === user?._id;

    return (
        <div className="p-4 md:p-6 lg:p-8">
            {showPlaylistModal && <SaveToPlaylistModal videoId={videoId} onClose={() => setShowPlaylistModal(false)} />}

            <div className="flex flex-col lg:flex-row gap-8">
                {/* --- Main Content --- */}
                <div className="w-full lg:flex-grow">
                <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                    {isExternalVideo ? (
                        // --- THIS IS THE FOOLPROOF FIX ---
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&origin=${window.location.origin}`}
                            title={video.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    ) : (
                        // This part for your own videos remains the same
                        <video 
                            key={video.videofile} 
                            src={video.videofile} 
                            controls 
                            className="w-full h-full" 
                        />
                    )}
                </div>
                    
                    <h1 className="text-2xl font-bold text-white mt-4">{video.title}</h1>
                    
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mt-4">
                        <div className="flex items-center mb-4 md:mb-0">
                            <img src={video.owner?.avatar || placeholderAvatar} alt={video.owner?.username} className="w-12 h-12 rounded-full bg-gray-700" />
                            <div className="ml-4">
                                <p className="font-semibold text-white">{video.owner?.username}</p>
                                <p className="text-sm text-gray-400">{subscribersCount} subscribers</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <button disabled={isExternalVideo} onClick={handleLikeToggle} className={`flex items-center gap-2 font-bold py-2 px-4 rounded-full transition-colors duration-200 ${isLiked ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                                👍 {likesCount}
                            </button>
                            <button disabled={isExternalVideo} onClick={() => setShowPlaylistModal(true)} className="bg-gray-700 hover:bg-gray-600 font-bold py-2 px-4 rounded-full disabled:opacity-50 disabled:cursor-not-allowed">
                                💾 Save
                            </button>
                            {!isOwner && (
                                <button disabled={isExternalVideo} onClick={handleSubscriptionToggle} className={`font-bold py-2 px-5 rounded-full transition-colors duration-200 ${isSubscribed ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-700'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                                    {isSubscribed ? 'Subscribed' : 'Subscribe'}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 bg-gray-800 p-4 rounded-lg">
                        <p className={`text-white whitespace-pre-wrap text-sm ${!isDescriptionExpanded && 'line-clamp-2'}`}>
                            {video.description}
                        </p>
                        <button onClick={() => setIsDescriptionExpanded(prev => !prev)} className="text-indigo-400 font-semibold mt-2 text-sm">
                            {isDescriptionExpanded ? 'Show less' : 'Show more'}
                        </button>
                    </div>

                    {!isExternalVideo && <CommentsSection videoId={videoId} isExternal={false} />}
                    {isExternalVideo && <CommentsSection videoId={videoId} isExternal={true} />}
                </div>

                {/* --- "Up Next" Sidebar --- */}
                <div className="w-full lg:w-96 lg:flex-shrink-0">
                    <h2 className="text-xl font-bold text-white mb-4">Up Next</h2>
                    <div className="space-y-4">
                        {recommendedVideos.map(recVideo => <RecommendedVideoCard key={recVideo._id || recVideo.videoId} video={recVideo} />)}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default WatchPage;