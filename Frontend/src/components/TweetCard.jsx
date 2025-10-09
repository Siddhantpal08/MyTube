import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
    const isOwner = user?._id === tweet.owner?._id;

    const [isLiked, setIsLiked] = useState(tweet.isLiked);
    const [likesCount, setLikesCount] = useState(tweet.likesCount);

    const handleLike = async () => {
        if (!isAuthenticated) {
            return toast.error("Please log in to like posts.");
        }
        
        setIsLiked(prev => !prev);
        setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

        try {
            await axiosClient.post(`/likes/toggle/t/${tweet._id}`);
        } catch (error) {
            setIsLiked(prev => !prev);
            setLikesCount(prev => isLiked ? prev + 1 : prev - 1);
            toast.error("Failed to update like status.");
        }
    };

    return (
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex items-start space-x-4">
            <Link to={`/channel/${tweet.owner?.username}`}>
                <img src={tweet.owner?.avatar || placeholderAvatar} alt={tweet.owner?.username} className="w-12 h-12 rounded-full object-cover" />
            </Link>
            <div className="flex-1 min-w-0"> {/* Added min-w-0 to prevent overflow */}
                <div className="flex justify-between items-start">
                    <div className="flex-1">
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

                {/* --- THE FINAL ICON FIX --- */}
                <div className="mt-3 flex items-center">
                    <button onClick={handleLike} className={`flex items-center space-x-2 transition-colors ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={isLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 015.13-1.637l.852.341.852-.341a4.5 4.5 0 015.13 1.637l2.877 4.801a4.5 4.5 0 01-1.638 5.13l-4.8 2.877a4.5 4.5 0 01-5.13-1.637l-.852-.341-.852.341a4.5 4.5 0 01-5.13-1.637l-2.877-4.8a4.5 4.5 0 011.638-5.132l4.8-2.877z" />
                        </svg>
                        <span className="font-semibold text-sm">{formatCompactNumber(likesCount)}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TweetCard;