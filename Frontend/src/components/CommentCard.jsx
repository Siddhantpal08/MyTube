// src/components/CommentCard.jsx

import React, { useState } from 'react';
import { useAuth } from '../Context/AuthContext';
import axiosClient from '../Api/axiosClient';
import toast from 'react-hot-toast';
import { placeholderAvatar, timeSince } from '../utils/formatters';
import ConfirmationModal from './ConfirmationModel'; // Make sure you have this component

function CommentCard({ comment, onCommentDeleted, onCommentUpdated }) {

    console.log("Comment Owner Data:", comment.owner);
    
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(comment.content);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    
    const isOwner = !comment.isExternal && (user?._id === comment.owner?._id);

    const handleDelete = async () => {
        try {
            // Use the correct API route for deleting a comment
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
            // Use the correct API route for updating a comment
            const response = await axiosClient.patch(`/comments/c/${comment._id}`, { content: editedContent });
            onCommentUpdated(response.data.data);
            setIsEditing(false);
            toast.success("Comment updated");
        } catch (err) {
            toast.error("Failed to update comment.");
        }
    };

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
                {/* 👇 FIX: Access the nested .url property for the avatar */}
                <img src={comment.owner?.avatar?.url || placeholderAvatar} alt={comment.owner?.username} className="w-10 h-10 rounded-full object-cover bg-gray-700" />
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