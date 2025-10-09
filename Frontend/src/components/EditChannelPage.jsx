import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import axiosClient from '../Api/axiosClient';
import toast from 'react-hot-toast';
import { placeholderAvatar } from '../utils/formatters';

// Reusable Input Field with theme-aware styles
const InputField = ({ label, name, type, value, onChange }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
        <input 
            type={type} 
            name={name} 
            id={name}
            value={value} 
            onChange={onChange} 
            className="w-full p-2 rounded-lg shadow-sm bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-red-500 focus:border-red-500" 
        />
    </div>
);

function EditChannelPage() {
    const { user, setUser } = useAuth(); // We need setUser to update the global state
    
    // State for each piece of editable data
    const [details, setDetails] = useState({ fullName: user?.fullName || '', email: user?.email || '' });
    const [avatar, setAvatar] = useState(null);
    const [coverImage, setCoverImage] = useState(null);
    
    // State for image previews
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar || placeholderAvatar);
    const [coverPreview, setCoverPreview] = useState(user?.coverImage || '');

    // Independent loading states for each action
    const [isUpdatingDetails, setIsUpdatingDetails] = useState(false);
    const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
    const [isUpdatingCover, setIsUpdatingCover] = useState(false);

    const handleInputChange = (e) => {
        setDetails({ ...details, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        const file = files[0];
        if (file) {
            if (name === 'avatar') {
                setAvatar(file);
                setAvatarPreview(URL.createObjectURL(file));
            } else if (name === 'coverImage') {
                setCoverImage(file);
                setCoverPreview(URL.createObjectURL(file));
            }
        }
    };

    // --- API Handlers ---

    const handleDetailsUpdate = async (e) => {
        e.preventDefault();
        setIsUpdatingDetails(true);
        const toastId = toast.loading("Updating details...");
        try {
            const res = await axiosClient.patch('/users/update-account', details);
            setUser(prevUser => ({...prevUser, ...res.data.data})); // Update global auth context
            toast.success("Details updated successfully!", { id: toastId });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update details.", { id: toastId });
        } finally {
            setIsUpdatingDetails(false);
        }
    };
    
    const handleAvatarUpdate = async () => {
        if (!avatar) return;
        setIsUpdatingAvatar(true);
        const toastId = toast.loading("Updating avatar...");
        const formData = new FormData();
        formData.append('avatar', avatar);
        try {
            const res = await axiosClient.patch('/users/avatar', formData);
            setUser(prevUser => ({...prevUser, ...res.data.data}));
            setAvatar(null); // Clear the file input after successful upload
            toast.success("Avatar updated!", { id: toastId });
        } catch (error) {
            toast.error("Failed to update avatar.", { id: toastId });
        } finally {
            setIsUpdatingAvatar(false);
        }
    };

    const handleCoverImageUpdate = async () => {
        if (!coverImage) return;
        setIsUpdatingCover(true);
        const toastId = toast.loading("Updating cover image...");
        const formData = new FormData();
        formData.append('coverImage', coverImage);
        try {
            const res = await axiosClient.patch('/users/cover-image', formData);
            setUser(prevUser => ({...prevUser, ...res.data.data}));
            setCoverImage(null);
            toast.success("Cover image updated!", { id: toastId });
        } catch (error) {
            toast.error("Failed to update cover image.", { id: toastId });
        } finally {
            setIsUpdatingCover(false);
        }
    };

    // Show a loading state until the user data is available
    if (!user) {
        return <div className="p-4 text-center">Loading...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-8">
            <h1 className="text-3xl font-bold">Customize Channel</h1>

            <form onSubmit={handleDetailsUpdate} className="p-6 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold mb-4">Channel Information</h2>
                <div className="space-y-4">
                    <InputField label="Full Name" name="fullName" type="text" value={details.fullName} onChange={handleInputChange} />
                    <InputField label="Email" name="email" type="email" value={details.email} onChange={handleInputChange} />
                    <div className="text-right">
                        <button type="submit" disabled={isUpdatingDetails} className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold">
                            {isUpdatingDetails ? 'Saving...' : 'Save Details'}
                        </button>
                    </div>
                </div>
            </form>

            <div className="p-6 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
               <h2 className="text-xl font-semibold mb-4">Channel Avatar</h2>
               <div className="flex items-center gap-6">
                  <img src={avatarPreview} alt="Avatar Preview" className="w-24 h-24 rounded-full object-cover bg-gray-200 dark:bg-gray-700" />
                  <div className="flex-1">
                     <input type="file" name="avatar" id="avatar-upload" onChange={handleFileChange} className="hidden" />
                     <label htmlFor="avatar-upload" className="cursor-pointer font-semibold py-2 px-4 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">
                         Choose Image
                     </label>
                     {avatar && <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">{avatar.name}</span>}
                  </div>
                  <button onClick={handleAvatarUpdate} disabled={isUpdatingAvatar || !avatar} className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold">
                      {isUpdatingAvatar ? 'Uploading...' : 'Update Avatar'}
                  </button>
               </div>
            </div>
            
            <div className="p-6 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
               <h2 className="text-xl font-semibold mb-4">Channel Cover Image</h2>
               <div className="w-full aspect-[16/5] rounded-lg bg-gray-200 dark:bg-gray-700 mb-4 overflow-hidden">
                  {coverPreview && <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />}
               </div>
               <div className="flex items-center gap-6">
                  <div className="flex-1">
                     <input type="file" name="coverImage" id="cover-upload" onChange={handleFileChange} className="hidden" />
                     <label htmlFor="cover-upload" className="cursor-pointer font-semibold py-2 px-4 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">
                         Choose Image
                     </label>
                     {coverImage && <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">{coverImage.name}</span>}
                  </div>
                  <button onClick={handleCoverImageUpdate} disabled={isUpdatingCover || !coverImage} className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold">
                      {isUpdatingCover ? 'Uploading...' : 'Update Cover'}
                  </button>
               </div>
            </div>
        </div>
    );
}

export default EditChannelPage;