import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import axiosClient from '../Api/axiosClient';
import toast from 'react-hot-toast';
import { placeholderAvatar, timeSince, formatCompactNumber } from '../utils/formatters';
import ConfirmationModal from './ConfirmationModel';
import { useNavigate, useLocation } from 'react-router-dom';

function CommentCard({ comment, onCommentDeleted, onCommentUpdated }) {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // State for local UI changes
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(comment.content);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    
    // State for the like functionality
    const [isLiked, setIsLiked] = useState(comment.isLiked || false);
    const [likesCount, setLikesCount] = useState(comment.likesCount || 0);

    // Determines if the current user owns this comment
    const isOwner = !comment.isExternal && (user?._id === comment.owner?._id);

    // --- NEW: Time Limit Logic for Editing ---
    // Calculate the time difference between now and when the comment was created.
    const fifteenMinutes = 15 * 60 * 1000; // 15 minutes in milliseconds
    const commentTimestamp = new Date(comment.createdAt).getTime();
    const currentTimestamp = new Date().getTime();
    const canEdit = (currentTimestamp - commentTimestamp) < fifteenMinutes;
    // --- End of New Logic ---

    // --- HANDLER FUNCTIONS ---

    const handleLikeToggle = async () => {
        if (!isAuthenticated) {
            toast.error("Please log in to like a comment.");
            navigate('/login', { state: { from: location } });
            return;
        }
        if (comment.isExternal) return;

        const originalState = isLiked;
        setIsLiked(prev => !prev);
        setLikesCount(prev => (originalState ? prev - 1 : prev + 1));

        try {
            await axiosClient.post(`/likes/toggle/c/${comment._id}`);
        } catch (error) {
            toast.error("Failed to update like.");
            setIsLiked(originalState);
            setLikesCount(prev => (originalState ? prev + 1 : prev - 1));
        }
    };

    const handleDelete = async () => {
        try {
            await axiosClient.delete(`/comments/c/${comment._id}`);
            toast.success("Comment deleted");
            onCommentDeleted(comment._id);
        } catch (error) {
            toast.error("Failed to delete comment.");
        } finally {
            setShowDeleteModal(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editedContent.trim()) {
            toast.error("Comment cannot be empty.");
            return;
        }
        try {
            const response = await axiosClient.patch(`/comments/c/${comment._id}`, { content: editedContent });
            onCommentUpdated(response.data.data);
            setIsEditing(false);
            toast.success("Comment updated");
        } catch (err) {
            toast.error("Failed to update comment.");
        }
    };

    const getAvatarUrl = () => {
        if (!comment.owner) return placeholderAvatar;
        
        // If avatar is an object with a .url property (like from populate)
        if (typeof comment.owner.avatar === 'object' && comment.owner.avatar?.url) {
            return comment.owner.avatar.url;
        }
        
        // If avatar is a direct string URL
        if (typeof comment.owner.avatar === 'string') {
            return comment.owner.avatar;
        }

        // Fallback to the placeholder
        return placeholderAvatar;
    };

    let avatarUrl = getAvatarUrl();
    if (avatarUrl && avatarUrl.startsWith('http://')) {
        avatarUrl = avatarUrl.replace('http://', 'https://');
    }

    // --- RENDER ---
    return (
        <>
            {showDeleteModal && ( <ConfirmationModal title="Delete Comment" message="Are you sure?" onConfirm={handleDelete} onCancel={() => setShowDeleteModal(false)} /> )}
            
            <div className="flex items-start space-x-4">
                    <img 
                        src={avatarUrl} // Use the final, safe URL
                        alt={comment.owner?.username} 
                        className="w-10 h-10 rounded-full object-cover bg-gray-200 dark:bg-gray-700" 
                    />
                    <div className="w-full">
                    <div className="flex items-center space-x-2">
                        <p className="font-bold text-sm text-gray-900 dark:text-white">{comment.owner?.username || "User"}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-normal">{timeSince(comment.createdAt)}</p>
                    </div>

                    {!isEditing ? (
                        <p className="text-gray-800 dark:text-gray-300 mt-1 whitespace-pre-wrap">{comment.content}</p>
                    ) : (
                        <form onSubmit={handleUpdate} className="mt-2">
                            <textarea value={editedContent} onChange={(e) => setEditedContent(e.target.value)} className="w-full p-2 rounded-md bg-gray-200 dark:bg-gray-600" />
                            <div className="flex gap-2 mt-2">
                                <button type="submit" className="bg-red-600 text-white text-xs px-3 py-1 rounded">Save</button>
                                <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-400 dark:bg-gray-500 text-xs px-3 py-1 rounded">Cancel</button>
                            </div>
                        </form>
                    )}
                    
                    {!isEditing && (
                        <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1">
                                <button onClick={handleLikeToggle} disabled={comment.isExternal}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-colors ${isLiked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'}`} viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{formatCompactNumber(likesCount)}</span>
                            </div>
                            
                            {isOwner && (
                                <>
                                    {canEdit && (
                                        <button onClick={() => setIsEditing(true)} className="text-xs text-gray-500 dark:text-gray-400 font-semibold hover:text-black dark:hover:text-white">Edit</button>
                                    )}
                                    <button onClick={() => setShowDeleteModal(true)} className="text-xs text-gray-500 dark:text-gray-400 font-semibold hover:text-black dark:hover:text-white">Delete</button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default CommentCard;