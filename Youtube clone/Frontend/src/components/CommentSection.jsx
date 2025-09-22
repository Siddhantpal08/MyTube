import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../Api/axiosClient';
import toast from 'react-hot-toast';

// --- Helper Functions & Components ---

const timeSince = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "just now";
};

const placeholderAvatar = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2EwYWVjMCI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMTguNzUgMTkuMTI1YTUuMjUgNS4yNSAwIDAgMC0xMC41IDBWMTguNzVjMC0uNDEzLS4wMy0uODI2LS4wODItMS4yMzFsLS43NTQtLjM3N2EuNzUuNzUgMCAwIDAtLjQ5OC44MDVsLjc4NyA0LjcyM2MwIC4zOTYuMzQuNzI2LjczNi43MjZoMTMuMjc0Yy4zOTUgMCAuNzM1LS4zMy43MzYtLjcyNmwzLjE0Ni0xOC44NzhhLjc1Ljc1IDAgMSAwLTEuNDc4LS4yNDhsLTIuMjkyIDEzLjc1MmEuMjUuMjUgMCAwIDEtLjQ4My4wODJsLS44MDgtMi4zMjNjLS4zNi0xLjAzNi0uOTcxLTEuOTg2LTEuNzUtMi44MTRhMy43NSA0LjEyNyAwIDAgMC0zLTEuMjg3aC0xLjVhMy43NSA0LjEyNyAwIDAgMC0zIDEuMjg3Yy0uNzc5LjgyOC0xLjM5IDIuNzU5LTEuNzUgMi44MTRsLS44MDggMi4zMjNhLjI1Ljg0MSAwIDAgMS0uNDgzLS4wODJsLS4zMy0uOTQyYS43NS43NSAwIDAgMC0xLjM5Ni40ODdsLjM1MyAxLjAwNWE1LjI1IDUuMjUgMCAwIDAgMTAuMDI4IDBMMTguNzUgMTkuMTI1WiIgY2xpcC1ydWxlPSJldmVub2RkIiAvPjwvc3ZnPg==`;

const CommentCard = ({ comment, isExternal, onCommentDeleted, onCommentUpdated }) => {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(comment.content);
    
    const isOwner = user?._id === comment.owner?._id;

    const handleDelete = async () => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await axiosClient.delete(`/comments/c/${comment._id}`);
            toast.success("Comment deleted");
            onCommentDeleted(comment._id);
        } catch (err) {
            toast.error("Failed to delete comment.");
            console.error(err);
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
                        <button onClick={handleDelete} className="text-xs text-red-400 font-semibold">Delete</button>
                    </div>
                )}
            </div>
        </div>
    );
};

function CommentsSection({ videoId, isExternal }) {
    const { isAuthenticated, user } = useAuth();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [page, setPage] = useState(1);
    const [nextPageToken, setNextPageToken] = useState(null);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false); // NEW: For pagination   
    const [error, setError] = useState(null);

    // FIXED: The full implementation of this function was restored
    const fetchComments = useCallback(async (pageNum = 1, pToken = null) => {
        if (!videoId) return;
        
        const isFirstPage = pageNum === 1 && !pToken;
        isFirstPage ? setLoading(true) : setLoadingMore(true);

        const url = isExternal
            ? `/youtube/comments/${videoId}?pageToken=${pToken || ''}`
            : `/comments/${videoId}?page=${pageNum}`;
        
        try {
            const res = await axiosClient.get(url);
            const data = res.data.data;
            setComments(prev => isFirstPage ? data.docs : [...prev, ...data.docs]);
            
            if (isExternal) {
                setNextPageToken(data.nextPageToken);
            } else {
                setPage(data.nextPage || pageNum + 1);
            }
            setHasNextPage(data.hasNextPage);
        } catch (err) {
            setError("Could not load comments.");
            console.error(err);
            setHasNextPage(false);
        } finally {
            if(isFirstPage) setLoading(false) ; setLoadingMore(false);
        }
    }, [videoId, isExternal]);

    useEffect(() => {
        fetchComments(1, null);
    }, [videoId, isExternal, fetchComments]);

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            const response = await axiosClient.post(`/comments/${videoId}`, { content: newComment });
            const newPopulatedComment = { ...response.data.data, owner: { ...user } };
            setComments(prev => [newPopulatedComment, ...prev]);
            setNewComment("");
            toast.success("Comment posted!");
        } catch (error) {
            toast.error("Failed to post comment.",error);
        }
    };

    const onCommentDeleted = (commentId) => setComments(prev => prev.filter(c => c._id !== commentId));
    const onCommentUpdated = (updatedComment) => setComments(prev => prev.map(c => c._id === updatedComment._id ? { ...c, content: updatedComment.content } : c));
    const handleLoadMore = () => isExternal ? fetchComments(null, nextPageToken) : fetchComments(page, null);
    
    if (loading) return <p className="text-center text-gray-400 p-4">Loading comments...</p>;
    if (error) return <p className="text-red-500 text-center p-4">{error}</p>;

    return (
        <div className="mt-6">
            <h2 className="text-xl font-bold mb-4">{comments.length > 0 ? `${comments.length.toLocaleString()} Comments` : "Comments"}</h2>
            
            {!isExternal && isAuthenticated && (
                <form onSubmit={handleAddComment} className="flex items-start space-x-4 mb-8">
                    <img src={user.avatar || placeholderAvatar} alt="your avatar" className="w-10 h-10 rounded-full" />
                    <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." className="flex-grow p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" rows="1"/>
                    <button type="submit" className="bg-indigo-600 font-semibold px-4 py-2 rounded-md h-10">Comment</button>
                </form>
            )}

            {loading ? <p>Loading comments...</p> : (
                <div className="space-y-6">
                    {comments.map(comment => 
                        <CommentCard key={comment._id} comment={comment} isExternal={isExternal} onCommentDeleted={onCommentDeleted} onCommentUpdated={onCommentUpdated} />
                    )}
                </div>
            )}

            {hasNextPage && (
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