import React, { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import axiosClient from '../Api/axiosClient';
import toast from 'react-hot-toast';
import { placeholderAvatar } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '../components/ConfirmationModel'; // Import your modal

// A reusable component for each settings section
const SettingsSection = ({ title, children, isDangerZone = false }) => (
    <div className={`p-6 rounded-lg mb-8 ${isDangerZone ? 'bg-red-900/20 border border-red-500/30' : 'bg-gray-800'}`}>
        <h2 className={`text-xl font-semibold mb-6 border-b pb-3 ${isDangerZone ? 'text-red-400 border-red-500/30' : 'border-gray-700'}`}>{title}</h2>
        {children}
    </div>
);

function SettingsPage() {
    const { user, setUser, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    
    // --- State for Forms ---
    const [fullName, setFullName] = useState('');
    // ... (keep all your other form states)
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // --- NEW: Redirect guest users ---
    useEffect(() => {
        // If the auth state is loaded and the user is not authenticated, redirect to login
        if (!isAuthenticated) {
            toast.error("You must be logged in to view settings.");
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    // --- NEW: Theme Switcher Logic ---
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    useEffect(() => {
        if (theme === 'light') {
            document.documentElement.classList.remove('dark');
        } else {
            document.documentElement.classList.add('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    // --- Existing Handler Functions ---
    // ... (keep all your existing handlers: handleAvatarUpdate, handleProfileUpdate, etc.)

    // --- NEW: Handler for Account Deletion ---
    const handleDeleteAccount = async () => {
        const toastId = toast.loading("Deleting account...");
        try {
            await axiosClient.delete('/users');
            toast.success("Account deleted successfully.", { id: toastId });
            logout(); // Clear auth state from context
            navigate('/'); // Redirect to homepage
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete account.", { id: toastId });
        } finally {
            setShowDeleteModal(false);
        }
    };
    
    // Don't render anything until we know the auth status
    if (!user) {
        return <div className="text-center text-white p-8">Loading...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 text-white">
            {showDeleteModal && (
                <ConfirmationModal
                    title="Delete Account"
                    message="Are you sure? This action is permanent and all your data, including videos and comments, will be lost."
                    onConfirm={handleDeleteAccount}
                    onCancel={() => setShowDeleteModal(false)}
                />
            )}

            <h1 className="text-3xl font-bold mb-8">Settings</h1>

            {/* --- NEW: "Feel Good" Theme Switcher --- */}
            <SettingsSection title="Appearance">
                <div className="flex items-center gap-4">
                    <p className="text-gray-400">Theme:</p>
                    <button onClick={() => setTheme('dark')} className={`font-semibold py-2 px-4 rounded-md ${theme === 'dark' ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}>Dark</button>
                    <button onClick={() => setTheme('light')} className={`font-semibold py-2 px-4 rounded-md ${theme === 'light' ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}>Light</button>
                </div>
                <p className="text-xs text-gray-500 mt-2">*Note: For a site-wide theme, this logic should be moved to a global ThemeContext.</p>
            </SettingsSection>

            {/* --- Existing Settings Sections --- */}
            {/* ... (keep your existing SettingsSection components for Avatar, Profile, etc.) ... */}
            
            {/* --- NEW: Delete Account Section --- */}
            <SettingsSection title="Danger Zone" isDangerZone={true}>
                <p className="text-gray-400 mb-4">Deleting your account is a permanent action. All of your data, including your channel, videos, comments, and playlists, will be removed forever. This cannot be undone.</p>
                <button 
                    onClick={() => setShowDeleteModal(true)} 
                    className="bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-5 rounded-md"
                >
                    Delete My Account
                </button>
            </SettingsSection>
        </div>
    );
}

export default SettingsPage;