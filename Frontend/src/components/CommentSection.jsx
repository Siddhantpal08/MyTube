import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../Context/AuthContext';
import axiosClient from '../Api/axiosClient';
import toast from 'react-hot-toast';
import { formatCompactNumber, placeholderAvatar, timeSince } from '../utils/formatters';
import ConfirmationModal from './ConfirmationModel'; // Assuming you have this component
import CommentCard from './CommentCard';


// --- The main CommentsSection component ---
function CommentsSection({ videoId }) {
    const { isAuthenticated, user } = useAuth();
    const [comments, setComments] = useState([]);
    const [totalComments, setTotalComments] = useState(0);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isPosting, setIsPosting] = useState(false);
    
    // Pagination state (simplified)
    const [hasNextPage, setHasNextPage] = useState(false);
    const [nextPage, setNextPage] = useState(2);

    const fetchComments = useCallback(async (page = 1) => {
        setLoading(page === 1);
        setError(null);
        try {
            // This single endpoint is smart enough to handle both internal and external videos
            const response = await axiosClient.get(`/comments/${videoId}?page=${page}&limit=10`);
            const data = response.data.data;
            
            const allComments = data.comments || [];
            if (page > 1) {
                setComments(prev => [...prev, ...allComments]);
            } else {
                setComments(allComments);
            }

            setTotalComments(data.totalComments || 0);
            setHasNextPage(data.hasNextPage || false);
            setNextPage(data.nextPage || page + 1);

        } catch (err) {
            setError("Could not load comments.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [videoId]);

    useEffect(() => {
        fetchComments(1); // Fetch the first page of comments when the component loads
    }, [fetchComments]);

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setIsPosting(true);
        try {
            // The backend is smart enough to know if it's an internal or external video
            const response = await axiosClient.post(`/comments/${videoId}`, { content: newComment });
            const createdComment = response.data.data;

            // Add the new comment to the top of the list instantly
            setComments(prev => [createdComment, ...prev]);
            setTotalComments(prev => prev + 1);
            setNewComment("");
            toast.success("Your comment was posted!");
        } catch(err) {
            toast.error(err.response?.data?.message || "Failed to post comment.");
        } finally {
            setIsPosting(false);
        }
    };
    
    const onCommentDeleted = (commentId) => {
        setComments(prev => prev.filter(c => c._id !== commentId));
        setTotalComments(prev => prev - 1);
    };

    const onCommentUpdated = (updatedComment) => {
        setComments(prev => prev.map(c => c._id === updatedComment._id ? updatedComment : c));
    };

    if (loading) return <p className="text-center text-gray-400 p-4">Loading comments...</p>;

    return (
        <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">{formatCompactNumber(totalComments)} Comments</h2>
            
            {isAuthenticated ? (
                <form onSubmit={handleAddComment} className="flex items-start space-x-4 mb-8">
                    <img src={user?.avatar || placeholderAvatar} alt="your avatar" className="w-10 h-10 rounded-full object-cover" />
                    <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a public comment..." className="flex-grow p-2 bg-gray-700 text-white rounded-md" disabled={isPosting}/>
                    <button type="submit" className="bg-red-600 font-semibold px-4 py-2 rounded-md h-10" disabled={isPosting || !newComment.trim()}>Comment</button>
                </form>
            ) : (
                <div className="text-gray-400 mb-8 p-4 border border-gray-700 rounded-lg">
                    <Link to="/login" className="font-semibold text-red-500 hover:text-red-400">Log in</Link> to add a comment.
                </div>
            )}

            {error && <p className="text-red-500 text-center p-4">{error}</p>}

            <div className="space-y-6">
                {/* This .map() function will now correctly render your CommentCard components */}
                {comments.map(c => <CommentCard key={c._id} comment={c} onCommentDeleted={onCommentDeleted} onCommentUpdated={onCommentUpdated} />)}
            </div>

            {hasNextPage && (
               <div className="text-center mt-6">
                   <button onClick={() => fetchComments(nextPage)} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded">
                       Load More Comments
                   </button>
               </div>
            )}
        </div>  
    );
}

export default CommentsSection;