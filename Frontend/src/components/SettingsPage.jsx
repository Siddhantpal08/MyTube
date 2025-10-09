import React, { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import axiosClient from '../Api/axiosClient';
import toast from 'react-hot-toast';
import { placeholderAvatar } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '../components/ConfirmationModel';

const SettingsSection = ({ title, children, isDangerZone = false }) => (
    <div className={`p-6 rounded-lg mb-8 ${isDangerZone ? 'bg-red-900/20 border border-red-500/30' : 'bg-gray-800'}`}>
        <h2 className={`text-xl font-semibold mb-6 border-b pb-3 ${isDangerZone ? 'text-red-400 border-red-500/30' : 'border-gray-700'}`}>{title}</h2>
        {children}
    </div>
);

function SettingsPage() {
    const { user, setUser, isAuthenticated, logout, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    
    // State for forms & UI
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Theme state
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
    
    // Redirect guest users
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            toast.error("You must be logged in to view settings.");
            navigate('/login');
        }
    }, [authLoading, isAuthenticated, navigate]);

    // Populate forms with user data
    useEffect(() => {
        if (user) {
            setFullName(user.fullName || '');
            setEmail(user.email || '');
            setAvatarPreview(user.avatar || placeholderAvatar);
        }
    }, [user]);
    
    // Theme effect
    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('theme', theme);
    }, [theme]);

    const handleFileChange = (e, setFile, setPreview) => {
        const file = e.target.files[0];
        if (file) {
            setFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleAvatarUpdate = async (e) => {
        e.preventDefault();
        if (!avatarFile) return toast.error("Please select a file first.");
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        
        setIsSubmitting(true);
        const toastId = toast.loading("Uploading avatar...");
        try {
            const response = await axiosClient.patch('/users/avatar', formData);
            setUser(response.data.data);
            toast.success("Avatar updated!", { id: toastId });
            setAvatarFile(null);
        } catch (error) {
            toast.error(error.response?.data?.message || "Upload failed.", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const toastId = toast.loading("Updating profile...");
        try {
            const response = await axiosClient.patch('/users/update-account', { fullName, email });
            setUser(response.data.data);
            toast.success("Profile updated!", { id: toastId });
        } catch (error) {
            toast.error(error.response?.data?.message || "Update failed.", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAccount = async () => {
        setIsSubmitting(true);
        const toastId = toast.loading("Deleting account...");
        try {
            await axiosClient.delete('/users');
            toast.success("Account deleted successfully.", { id: toastId });
            logout();
            navigate('/');
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete account.", { id: toastId });
        } finally {
            setIsSubmitting(false);
            setShowDeleteModal(false);
        }
    };
    
    if (authLoading || !user) {
        return <div className="text-center text-white p-8">Loading Settings...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 text-white">
            {showDeleteModal && ( <ConfirmationModal title="Delete Account" message="Are you sure? This action is permanent and all your data will be lost." onConfirm={handleDeleteAccount} onCancel={() => setShowDeleteModal(false)} /> )}
            <h1 className="text-3xl font-bold mb-8">Settings</h1>

            <SettingsSection title="Appearance">
                <div className="flex items-center gap-4">
                    <p className="text-gray-400">Theme:</p>
                    <button onClick={() => setTheme('dark')} disabled={isSubmitting} className={`font-semibold py-2 px-4 rounded-md ${theme === 'dark' ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}>Dark</button>
                    <button onClick={() => setTheme('light')} disabled={isSubmitting} className={`font-semibold py-2 px-4 rounded-md ${theme === 'light' ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}>Light</button>
                </div>
                <p className="text-xs text-gray-500 mt-2">*Note: For a site-wide theme, this logic should be moved to a global ThemeContext.</p>
            </SettingsSection>

            <SettingsSection title="Profile Picture">
                <div className="flex items-center gap-6">
                    <img src={avatarPreview} alt="Avatar Preview" className="w-24 h-24 rounded-full object-cover bg-gray-700" />
                    <form onSubmit={handleAvatarUpdate}>
                        <label htmlFor="avatar-upload" className={`cursor-pointer font-bold py-2 px-4 rounded-md ${isSubmitting ? 'bg-gray-500' : 'bg-gray-700 hover:bg-gray-600'}`}>Choose Image</label>
                        <input id="avatar-upload" type="file" accept="image/*" onChange={(e) => handleFileChange(e, setAvatarFile, setAvatarPreview)} className="hidden" disabled={isSubmitting} />
                        {avatarFile && <button type="submit" className="ml-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50" disabled={isSubmitting}>Upload</button>}
                    </form>
                </div>
            </SettingsSection>
            
            <SettingsSection title="Account Details">
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
                        <input type="text" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full p-2 bg-gray-700 rounded-md" disabled={isSubmitting}/>
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                        <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 bg-gray-700 rounded-md" disabled={isSubmitting} />
                    </div>
                    <div className="text-right pt-2"><button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-5 rounded-md disabled:opacity-50" disabled={isSubmitting}>Save Details</button></div>
                </form>
            </SettingsSection>

            <SettingsSection title="Danger Zone" isDangerZone={true}>
                <p className="text-gray-400 mb-4">Deleting your account is a permanent action and cannot be undone.</p>
                <button onClick={() => setShowDeleteModal(true)} className="bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-5 rounded-md" disabled={isSubmitting}>Delete My Account</button>
            </SettingsSection>
        </div>
    );
}

export default SettingsPage;