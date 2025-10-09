import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import axiosClient from '../Api/axiosClient';
import { timeSince, placeholderAvatar, formatCompactNumber } from '../utils/formatters';
import toast from 'react-hot-toast';

// Icon components
const HeartIcon = ({ isLiked }) => ( <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-colors ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-white'}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg> );
const ReplyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

const TweetCard = ({ tweet, onDelete }) => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isOwner = user?._id === tweet.owner?._id;

    // State for likes and replies
    const [isLiked, setIsLiked] = useState(tweet.isLiked);
    const [likesCount, setLikesCount] = useState(tweet.likesCount);
    const [replyCount, setReplyCount] = useState(tweet.replyCount || 0);
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [isReplying, setIsReplying] = useState(false);

    const handleLikeToggle = async () => { /* ... (your existing like handler) */ };

    const handlePostReply = async (e) => {
        e.preventDefault();
        if (!replyContent.trim()) return;
        setIsReplying(true);
        try {
            await axiosClient.post(`/tweets`, { 
                content: replyContent,
                parentTweetId: tweet._id 
            });
            setReplyCount(prev => prev + 1);
            setReplyContent('');
            setShowReplyInput(false);
            toast.success("Your reply was posted!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to post reply.");
        } finally {
            setIsReplying(false);
        }
    };

    return (
        <div className="bg-gray-800 p-4 rounded-lg flex flex-col space-y-4 border border-gray-700">
            <div className="flex items-start space-x-4 w-full">
                <Link to={`/channel/${tweet.owner?.username}`}>
                    <img src={tweet.owner?.avatar || placeholderAvatar} alt={tweet.owner?.username} className="w-12 h-12 rounded-full object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center flex-wrap space-x-2">
                                <Link to={`/channel/${tweet.owner?.username}`} className="font-bold text-white hover:underline truncate">{tweet.owner?.fullName}</Link>
                                <span className="text-gray-400 text-sm truncate">@{tweet.owner?.username}</span>
                                <span className="text-gray-500 text-sm flex-shrink-0">· {timeSince(tweet.createdAt)}</span>
                            </div>
                            <p className="text-gray-300 mt-1 whitespace-pre-wrap break-words">{tweet.content}</p>
                        </div>
                        {isOwner && (
                            <button onClick={() => onDelete(tweet._id)} title="Delete" className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-700 ml-2">
                                <DeleteIcon />
                            </button>
                        )}
                    </div>
                    <div className="mt-3 flex items-center space-x-6">
                        <button onClick={() => setShowReplyInput(prev => !prev)} disabled={isOwner} className="flex items-center gap-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed">
                            <ReplyIcon />
                            <span className="text-xs">{formatCompactNumber(replyCount)}</span>
                        </button>
                        <button onClick={handleLikeToggle} className="flex items-center gap-2">
                            <HeartIcon isLiked={isLiked} />
                            <span className={`text-xs font-semibold ${isLiked ? 'text-red-500' : 'text-gray-400'}`}>{formatCompactNumber(likesCount)}</span>
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
                            className="w-full p-2 bg-gray-700 text-white rounded-md focus:ring-2 focus:ring-red-500 outline-none"
                            rows="2"
                            disabled={isReplying}
                        />
                        <div className="text-right mt-2">
                            <button type="submit" className="bg-red-600 font-semibold px-4 py-2 rounded-md disabled:opacity-50" disabled={isReplying || !replyContent.trim()}>
                                {isReplying ? 'Posting...' : 'Reply'}
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
};

export default TweetCard;