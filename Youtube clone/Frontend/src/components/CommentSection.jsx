import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../Context/AuthContext';
import axiosClient from '../Api/axiosClient';
import toast from 'react-hot-toast';
import { formatCompactNumber, placeholderAvatar, timeSince } from '../utils/formatters';
import ConfirmationModal from './ConfirmationModel';


const CommentCard = ({ comment, isExternal, onCommentDeleted, onCommentUpdated }) => {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(comment.content);
    const isOwner = user?._id === comment.owner?._id;
    const [showDeleteModal, setShowDeleteModal] = useState(false); // <-- State for the modal


    const handleDelete = async () => {
        try {
            await axiosClient.delete(`/comments/c/${comment._id}`);
            toast.success("Comment deleted");
            onCommentDeleted(comment._id);
        } catch (error) {
            toast.error("Failed to delete comment.");
        } finally {
            setShowDeleteModal(false); // Close the modal
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
            console.error(err);
        }
    };

    return (
        <>
        {showDeleteModal && 
            <ConfirmationModal title="Delete Comment"
            message="Are you sure you want to permanently delete this comment?" // <-- This was missing
            onConfirm={handleDelete}
            onCancel={() => setShowDeleteModal(false)} />}
            
            <div className="flex items-start space-x-4">
            <img src={comment.owner?.avatar || placeholderAvatar} alt={comment.owner?.username} className="w-10 h-10 rounded-full bg-gray-700" />
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
                            <button type="submit" className="bg-indigo-600 text-xs px-3 py-1 rounded">Save</button>
                            <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-500 text-xs px-3 py-1 rounded">Cancel</button>
                        </div>
                    </form>
                )}
                {!isExternal && isOwner && !isEditing && (
                    <div className="flex gap-4 mt-2">
                        <button onClick={() => setIsEditing(true)} className="text-xs text-indigo-400 font-semibold">Edit</button>
                        <button onClick={() => setShowDeleteModal(true)} className="text-xs text-red-400 font-semibold">Delete</button>
                    </div>
                )}
            </div>
        </div>
        </>
    );
};

function CommentsSection({ videoId, isExternal }) {
    const { isAuthenticated, user } = useAuth();
    const [internalComments, setInternalComments] = useState([]);
    const [youtubeComments, setYoutubeComments] = useState([]);
    const [totalComments, setTotalComments] = useState(0);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // State for pagination
    const [internalPage, setInternalPage] = useState(1);
    const [ytNextPageToken, setYtNextPageToken] = useState(null);
    const [hasMoreInternal, setHasMoreInternal] = useState(false);
    const [hasMoreYoutube, setHasMoreYoutube] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchComments = useCallback(async () => {
        if (!videoId) return;
        setLoading(true);
        setError(null);
        try {
            if (isExternal) {
                const [ytRes, internalRes] = await Promise.all([
                    axiosClient.get(`/youtube/comments/${videoId}`),
                    axiosClient.get(`/comments/yt/${videoId}`)
                ]);
                setYoutubeComments(ytRes.data.data.docs || []);
                setInternalComments(internalRes.data.data.docs || []);
                
                const ytTotal = ytRes.data.data.pageInfo?.totalResults || 0;
                const internalTotal = internalRes.data.data.totalDocs || 0;
                setTotalComments(ytTotal + internalTotal);

                setHasMoreYoutube(ytRes.data.data.hasNextPage);
                setYtNextPageToken(ytRes.data.data.nextPageToken);
            } else {
                const res = await axiosClient.get(`/comments/${videoId}`);
                setInternalComments(res.data.data.docs || []);
                setTotalComments(res.data.data.totalDocs || 0);
                setHasMoreInternal(res.data.data.hasNextPage);
                setInternalPage(res.data.data.nextPage || 2);
            }
        } catch (err) {
            setError("Could not load comments.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [videoId, isExternal]);

    useEffect(() => {
        fetchComments(); // This matches the function defined below
    }, [fetchComments]);

    const handleLoadMore = async () => {
        setLoadingMore(true);
        try {
            if (isExternal) {
                const res = await axiosClient.get(`/youtube/comments/${videoId}?pageToken=${ytNextPageToken}`);
                setYoutubeComments(prev => [...prev, ...res.data.data.docs]);
                setHasMoreYoutube(res.data.data.hasNextPage);
                setYtNextPageToken(res.data.data.nextPageToken);
            } else {
                const res = await axiosClient.get(`/comments/${videoId}?page=${internalPage}`);
                setInternalComments(prev => [...prev, ...res.data.data.docs]);
                setHasMoreInternal(res.data.data.hasNextPage);
                setInternalPage(res.data.data.nextPage || internalPage + 1);
            }
        } catch {
            toast.error("Could not load more comments.");
        } finally {
            setLoadingMore(false);
        }
    };
    
    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            const response = await axiosClient.post(`/comments/${videoId}`, { content: newComment, isExternal });
            const newPopulatedComment = { ...response.data.data, owner: { ...user } };
            setInternalComments(prev => [newPopulatedComment, ...prev]);
            setTotalComments(prev => prev + 1);
            setNewComment("");
            toast.success("Your comment was posted!");
        } catch {
            toast.error("Failed to post comment.");
        }
    };
    
    const onCommentDeleted = (commentId) => {
        setInternalComments(prev => prev.filter(c => c._id !== commentId));
        setTotalComments(prev => prev - 1);
    };

    const onCommentUpdated = (updatedComment) => {
        setInternalComments(prev => prev.map(c => c._id === updatedComment._id ? { ...c, content: updatedComment.content } : c));
    };

    if (loading) return <p className="text-center text-gray-400 p-4">Loading comments...</p>;
    if (error) return <p className="text-red-500 text-center p-4">{error}</p>;

    return (
        <div className="mt-6">
            <h2 className="text-xl font-bold mb-4">{formatCompactNumber(totalComments)} Comments</h2>
            {isAuthenticated ? (
                <form onSubmit={handleAddComment} className="flex items-start space-x-4 mb-8">
                    <img src={user?.avatar || placeholderAvatar} alt="your avatar" className="w-10 h-10 rounded-full" />
                    <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a public comment..." className="flex-grow p-2 bg-gray-700 text-white rounded-md"/>
                    <button type="submit" className="bg-indigo-600 font-semibold px-4 py-2 rounded-md h-10">Comment</button>
                </form>
            ) : (
                <div className="text-gray-400 mb-8 p-4 border border-gray-700 rounded-lg">Log in to add a comment.</div>
            )}

            <div className="space-y-6">
                {internalComments.map(c => <CommentCard key={c._id} comment={c} isExternal={false} onCommentDeleted={onCommentDeleted} onCommentUpdated={onCommentUpdated} />)}
            </div>

            {isExternal && youtubeComments.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-700">
                    <h3 className="text-lg font-semibold mb-4">Comments from YouTube</h3>
                    <div className="space-y-6">
                        {youtubeComments.map(c => <CommentCard key={c._id} comment={c} isExternal={true} />)}
                    </div>
                </div>
            )}
            {(hasMoreInternal || hasMoreYoutube) && (
               <div className="text-center mt-6">
                   <button onClick={handleLoadMore} disabled={loadingMore} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded disabled:opacity-50">
                       {loadingMore ? 'Loading...' : 'Load More'}
                   </button>
               </div>
            )}
        </div>  
);
}

export default CommentsSection;