import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { timeSince, placeholderAvatar } from '../utils/formatters';

// Helper function to check if a tweet is recent enough to be edited
const canEdit = (createdAt) => {
    const tweetDate = new Date(createdAt);
    const now = new Date();
    const diffInMinutes = (now.getTime() - tweetDate.getTime()) / 1000 / 60;
    return diffInMinutes < 15;
};

const TweetCard = ({ tweet, onDelete }) => {
    const { user } = useAuth();
    const isOwner = user?._id === tweet.owner?._id;

    return (
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex items-start space-x-4">
            <Link to={`/channel/${tweet.owner?.username}`}>
                <img src={tweet.owner?.avatar || placeholderAvatar} alt={tweet.owner?.username} className="w-12 h-12 rounded-full object-cover" />
            </Link>
            <div className="flex-1">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center space-x-2">
                            <Link to={`/channel/${tweet.owner?.username}`} className="font-bold text-white hover:underline">{tweet.owner?.fullName}</Link>
                            <span className="text-gray-400 text-sm">@{tweet.owner?.username}</span>
                            <span className="text-gray-500 text-sm">· {timeSince(tweet.createdAt)}</span>
                        </div>
                        <p className="text-gray-300 mt-1 whitespace-pre-wrap">{tweet.content}</p>
                    </div>

                    {/* --- Edit and Delete Buttons --- */}
                    {isOwner && (
                        <div className="flex-shrink-0 flex space-x-2">
                            {canEdit(tweet.createdAt) && (
                                <button title="Edit" className="text-gray-400 hover:text-white">
                                    {/* Edit Icon */}
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg>
                                </button>
                            )}
                            <button onClick={() => onDelete(tweet._id)} title="Delete" className="text-gray-400 hover:text-red-500">
                                {/* Delete Icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TweetCard;