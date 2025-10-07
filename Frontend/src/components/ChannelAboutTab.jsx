import React, { useState } from 'react';
import { useAuth } from '../Context/AuthContext';
import axiosClient from '../Api/axiosClient';
import toast from 'react-hot-toast';

function ChannelAboutTab({ channel }) {
    const { user, setUser } = useAuth();
    const isOwner = user?._id === channel?._id;

    const [isEditing, setIsEditing] = useState(false);
    const [aboutText, setAboutText] = useState(channel?.about || '');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.patch('/users/about', { about: aboutText });
            // Update the global user state if it's the current user's channel
            if (setUser) {
                setUser(prev => ({...prev, about: res.data.data.about}));
            }
            channel.about = res.data.data.about; // Update local state for immediate feedback
            toast.success("About section updated!");
            setIsEditing(false);
        } catch (error) {
            toast.error("Failed to save changes.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="text-white p-4">
            <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">About {channel.fullName}</h2>
            
            {isEditing ? (
                <div>
                    <textarea 
                        value={aboutText}
                        onChange={(e) => setAboutText(e.target.value)}
                        className="w-full h-40 p-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                        placeholder="Tell your viewers about your channel..."
                    />
                    <div className="flex gap-2 mt-2">
                        <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50">
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500">
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div className="whitespace-pre-wrap text-gray-300">
                    <p>{aboutText || (isOwner ? "You haven't added an about section yet. Click edit to add one!" : "This channel hasn't added an about section.")}</p>
                    {isOwner && (
                        <button onClick={() => setIsEditing(true)} className="mt-4 px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600 font-semibold">
                            Edit Description
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default ChannelAboutTab;