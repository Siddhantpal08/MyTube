// src/components/CommentCard.jsx

import React, { useState } from 'react';
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

    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(comment.content);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    
    // --- NEW: State for likes ---
    const [isLiked, setIsLiked] = useState(comment.isLiked || false);
    const [likesCount, setLikesCount] = useState(comment.likesCount || 0);

    const isOwner = !comment.isExternal && (user?._id === comment.owner?._id);

    // --- NEW: Handler for toggling a like ---
    const handleLikeToggle = async () => {
        if (!isAuthenticated) {
            toast.error("Please log in to like a comment.");
            navigate('/login', { state: { from: location } });
            return;
        }
        if (comment.isExternal) return; // Can't like external YouTube comments

        // Optimistic UI update for instant feedback
        const originalState = isLiked;
        setIsLiked(prev => !prev);
        setLikesCount(prev => (originalState ? prev - 1 : prev + 1));

        try {
            // Call the backend endpoint to toggle the like
            await axiosClient.post(`/likes/toggle/c/${comment._id}`);
        } catch (error) {
            toast.error("Failed to update like.");
            // Revert UI on failure
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
        try {
            const response = await axiosClient.patch(`/comments/c/${comment._id}`, { content: editedContent });
            onCommentUpdated(response.data.data);
            setIsEditing(false);
            toast.success("Comment updated");
        } catch (err) {
            toast.error("Failed to update comment.");
        }
    };

    let avatarUrl = typeof comment.owner?.avatar === 'string' 
        ? comment.owner.avatar 
        : comment.owner?.avatar?.url;
    if (avatarUrl && avatarUrl.startsWith('http://')) {
        avatarUrl = avatarUrl.replace('http://', 'https://');
    }

    return (
        <>
            {showDeleteModal && ( /* ... (Your existing modal JSX) */ )}
            <div className="flex items-start space-x-4">
                <img src={avatarUrl || placeholderAvatar} alt={comment.owner?.username} className="w-10 h-10 rounded-full object-cover bg-gray-700" />
                <div className="w-full">
                    <div className="flex items-center space-x-2">
                        <p className="font-bold text-sm text-white">{comment.owner?.username}</p>
                        <p className="text-xs text-gray-400 font-normal">{timeSince(comment.createdAt)}</p>
                    </div>
                    {/* ... (Your existing JSX for comment content and editing form) ... */}
                    {!isEditing && (
                        <div className="flex items-center gap-4 mt-2">
                             {/* --- NEW: Like Button and Count --- */}
                            <div className="flex items-center gap-1">
                                <button onClick={handleLikeToggle} disabled={comment.isExternal}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-colors ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-white'}`} viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                <span className="text-xs text-gray-400">{formatCompactNumber(likesCount)}</span>
                            </div>
                            
                            {isOwner && (
                                <>
                                    <button onClick={() => setIsEditing(true)} className="text-xs text-gray-400 font-semibold hover:text-white">Edit</button>
                                    <button onClick={() => setShowDeleteModal(true)} className="text-xs text-gray-400 font-semibold hover:text-white">Delete</button>
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