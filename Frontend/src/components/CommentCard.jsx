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
            {showDeleteModal && 
                <ConfirmationModal 
                    title="Delete Comment"
                    message="Are you sure you want to permanently delete this comment?"
                    onConfirm={handleDelete}
                    onCancel={() => setShowDeleteModal(false)} 
                />
            }
            <div className="flex items-start space-x-4">
                {/* 3. Use the final, corrected avatarUrl */}
                <img src={avatarUrl || placeholderAvatar} alt={comment.owner?.username} className="w-10 h-10 rounded-full object-cover bg-gray-700" />
                
                <div className="w-full">
                    <div className="flex items-center space-x-2">
                        <p className="font-bold text-sm text-white">{comment.owner?.username}</p>
                        <p className="text-xs text-gray-400 font-normal">{timeSince(comment.createdAt)}</p>
                    </div>
                    {!isEditing ? (
                        <p className="text-gray-300 mt-1 whitespace-pre-wrap">{comment.content}</p>
                    ) : (
                        <form onSubmit={handleUpdate} className="mt-2">
                            <textarea value={editedContent} onChange={(e) => setEditedContent(e.target.value)} className="w-full p-2 bg-gray-600 text-white rounded-md" />
                            <div className="flex gap-2 mt-2">
                                <button type="submit" className="bg-red-600 text-xs px-3 py-1 rounded">Save</button>
                                <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-500 text-xs px-3 py-1 rounded">Cancel</button>
                            </div>
                        </form>
                    )}
                    {isOwner && !isEditing && (
                        <div className="flex gap-4 mt-2">
                            <button onClick={() => setIsEditing(true)} className="text-xs text-red-400 font-semibold">Edit</button>
                            <button onClick={() => setShowDeleteModal(true)} className="text-xs text-gray-400 font-semibold">Delete</button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default CommentCard;