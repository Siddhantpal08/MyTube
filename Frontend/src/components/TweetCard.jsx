import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import axiosClient from '../Api/axiosClient';
import { timeSince, placeholderAvatar, formatCompactNumber } from '../utils/formatters';
import toast from 'react-hot-toast';
import { HeartIcon, ReplyIcon, DeleteIcon, ViewRepliesIcon } from './Icons'; // Import icons

const TweetCard = ({ tweet, onDelete, isReply = false }) => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isOwner = user?._id === tweet.owner?._id;

    // State for likes, replies, and UI toggles
    const [isLiked, setIsLiked] = useState(tweet.isLiked);
    const [likesCount, setLikesCount] = useState(tweet.likesCount);
    const [replyCount, setReplyCount] = useState(tweet.replyCount || 0);
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [isReplying, setIsReplying] = useState(false);
    const [replies, setReplies] = useState([]);
    const [showReplies, setShowReplies] = useState(false);
    const [loadingReplies, setLoadingReplies] = useState(false);

    // --- HANDLER FUNCTIONS ---
    
    const handleLikeToggle = async () => {
        if (!isAuthenticated) {
            toast.error("Please log in to like a post.");
            return navigate('/login', { state: { from: location } });
        }
        const originalState = isLiked;
        setIsLiked(prev => !prev);
        setLikesCount(prev => (originalState ? prev - 1 : prev + 1));
        try {
            await axiosClient.post(`/likes/toggle/t/${tweet._id}`);
        } catch (error) {
            toast.error("Failed to update like.");
            setIsLiked(originalState); // Revert on failure
            setLikesCount(prev => (originalState ? prev + 1 : prev - 1));
        }
    };

    const handlePostReply = async (e) => {
        e.preventDefault();
        if (!replyContent.trim()) return;
        setIsReplying(true);
        try {
            const response = await axiosClient.post(`/tweets`, { 
                content: replyContent,
                parentTweetId: tweet._id 
            });
            setReplies(prev => [response.data.data, ...prev]);
            setReplyCount(prev => prev + 1);
            setReplyContent('');
            setShowReplyInput(false);
            setShowReplies(true);
            toast.success("Your reply was posted!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to post reply.");
        } finally {
            setIsReplying(false);
        }
    };

    const fetchReplies = async () => {
        if (loadingReplies) return;
        setLoadingReplies(true);
        try {
            const response = await axiosClient.get(`/tweets/replies/${tweet._id}`);
            setReplies(response.data.data);
        } catch (error) {
            toast.error("Failed to fetch replies.");
        } finally {
            setLoadingReplies(false);
        }
    };

    const handleToggleReplies = () => {
        const newShowState = !showReplies;
        setShowReplies(newShowState);
        if (newShowState && replies.length === 0) {
            fetchReplies();
        }
    };

    return (
        <div className={`flex flex-col space-y-4 ${!isReply ? 'bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700' : ''}`}>
            <div className="flex items-start space-x-4 w-full">
                <Link to={`/channel/${tweet.owner?.username}`}>
                    <img src={tweet.owner?.avatar || placeholderAvatar} alt={tweet.owner?.username} className="w-12 h-12 rounded-full object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center flex-wrap space-x-2">
                            <Link to={`/channel/${tweet.owner?.username}`} className="font-bold text-black dark:text-white hover:underline truncate">{tweet.owner?.fullName}</Link>
                            <span className="text-gray-600 dark:text-gray-400 text-sm truncate">@{tweet.owner?.username}</span>
                            <span className="text-gray-500 text-sm flex-shrink-0">· {timeSince(tweet.createdAt)}</span>
                        </div>
                        {isOwner && (
                            <button onClick={() => onDelete(tweet._id)} title="Delete" className="text-gray-500 dark:text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ml-2">
                                <DeleteIcon />
                            </button>
                        )}
                    </div>
                    <p className="text-gray-800 dark:text-gray-300 mt-1 whitespace-pre-wrap break-words">{tweet.content}</p>
                    <div className="mt-3 flex items-center space-x-6">
                        <button onClick={() => setShowReplyInput(prev => !prev)} disabled={isOwner} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed">
                            <ReplyIcon />
                            <span className="text-xs">{formatCompactNumber(replyCount)}</span>
                        </button>
                        <button onClick={handleLikeToggle} className="flex items-center gap-2">
                            <HeartIcon isLiked={isLiked} />
                            <span className={`text-xs font-semibold ${isLiked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>{formatCompactNumber(likesCount)}</span>
                        </button>
                    </div>
                </div>
            </div>

            {showReplyInput && (
                <form onSubmit={handlePostReply} className="flex items-start space-x-4 pl-16 w-full">
                    <img src={user?.avatar || placeholderAvatar} alt="Your avatar" className="w-10 h-10 rounded-full object-cover"/>
                    <div className="w-full">
                        <textarea 
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder={`Replying to @${tweet.owner?.username}`} 
                            className="w-full p-2 bg-gray-100 dark:bg-gray-700 text-black dark:text-white rounded-md focus:ring-2 focus:ring-red-500 outline-none border border-gray-300 dark:border-transparent"
                            rows="2"
                            disabled={isReplying}
                        />
                        <div className="text-right mt-2">
                            <button type="submit" className="bg-red-600 text-white font-semibold px-4 py-2 rounded-md disabled:opacity-50" disabled={isReplying || !replyContent.trim()}>
                                {isReplying ? 'Posting...' : 'Reply'}
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {replyCount > 0 && (
                <div className="pl-16">
                    <button onClick={handleToggleReplies} className="text-sm font-semibold text-red-500 dark:text-red-400 hover:underline flex items-center gap-1">
                        <ViewRepliesIcon />
                        {showReplies ? 'Hide Replies' : `View ${replyCount} ${replyCount > 1 ? 'Replies' : 'Reply'}`}
                    </button>
                    {loadingReplies && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading replies...</p>}
                    {showReplies && !loadingReplies && (
                        <div className="mt-4 space-y-4 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                            {replies.map(reply => (
                                <TweetCard key={reply._id} tweet={reply} onDelete={onDelete} isReply={true} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TweetCard;