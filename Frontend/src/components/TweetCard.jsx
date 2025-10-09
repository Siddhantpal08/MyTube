import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import axiosClient from '../Api/axiosClient';
import { timeSince, placeholderAvatar, formatCompactNumber } from '../utils/formatters';
import toast from 'react-hot-toast';

const canEdit = (createdAt) => {
    const diffInMinutes = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60);
    return diffInMinutes < 15;
};

const TweetCard = ({ tweet, onDelete }) => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isOwner = user?._id === tweet.owner?._id;

    const [isLiked, setIsLiked] = useState(tweet.isLiked);
    const [likesCount, setLikesCount] = useState(tweet.likesCount);

    const handleLike = async () => {
        if (!isAuthenticated) {
            toast.error("Please log in to like posts.");
            navigate('/login', { state: { from: location } });
            return;
        }
        
        // Optimistic update
        const originalState = isLiked;
        setIsLiked(prev => !prev);
        setLikesCount(prev => originalState ? prev - 1 : prev + 1);

        try {
            await axiosClient.post(`/likes/toggle/t/${tweet._id}`);
        } catch (error) {
            // Revert on failure
            setIsLiked(originalState);
            setLikesCount(prev => originalState ? prev + 1 : prev - 1);
            toast.error("Failed to update like status.");
        }
    };

    return (
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex items-start space-x-4">
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
                        <div className="flex-shrink-0 flex items-center space-x-2 ml-2">
                            {canEdit(tweet.createdAt) && (
                                <Link to={`/tweet/${tweet._id}/edit`} title="Edit" className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg>
                                </Link>
                            )}
                            <button onClick={() => onDelete(tweet._id)} title="Delete" className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-700">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    )}
                </div>

                {/* --- UPDATED LIKE BUTTON --- */}
                <div className="mt-3 flex items-center space-x-6">
                    <button className="flex items-center gap-2 text-gray-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                        <span className="text-xs">Reply</span>
                    </button>
                    <button onClick={handleLike} className="flex items-center gap-2">
                        {/* This SVG is now a heart, matching your comments section */}
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-colors ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-white'}`} viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                        <span className={`text-xs font-semibold ${isLiked ? 'text-red-500' : 'text-gray-400'}`}>{formatCompactNumber(likesCount)}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TweetCard;