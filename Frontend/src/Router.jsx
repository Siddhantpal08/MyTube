import React from 'react';
import { createBrowserRouter } from 'react-router-dom';

// --- Core Layout & Helpers ---
import App from './App.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// --- Page Components ---
import HomePage from './components/HomePage.jsx';
import ExplorePage from './components/Explore.jsx';
import WatchPage from './components/Watchpage.jsx';
import SearchResults from './components/SearchResults.jsx';
import LoginPage from './components/Login.jsx';
import RegisterPage from './components/Register.jsx';
import SubscriptionsPage from './components/SubscriptionsPage.jsx';
import HistoryPage from './components/HistoryPage.jsx';
import PlaylistPage from './components/PlaylistPage.jsx';
import PlaylistDetailPage from './components/PlaylistDetailedPage.jsx';
import MyVideosPage from './components/MyVideosPage.jsx';
import UploadVideoPage from './components/UploadVideoPage.jsx';
import CreatorDashboard from './components/CreatorDashboard.jsx';
import CommunityPage from './components/CommunityPage.jsx';
import AddTweetPage from './components/AddTweetPage.jsx';
import ChannelPage from './components/ChannelPage.jsx';
import ChannelSearchPage from './components/ChannelSearchPage.jsx';
import CategoryPage from './components/CategoryPage.jsx';
import EditChannelPage from './components/EditChannelPage.jsx'; // This should be for your main account settings
import AboutPage from './components/AboutPage.jsx';
import ChannelAboutTab from './components/ChannelAboutTab.jsx';
// A simple fallback component to display when an error occurs during rendering.
// This prevents the application from crashing with a blank white screen.
const ErrorPage = () => (
    <div className="flex items-center justify-center min-h-screen bg-[#0F0F0F] text-white">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-red-500">Application Error</h1>
            <p className="mt-2 text-gray-400">Something went wrong. Please try refreshing the page.</p>
        </div>
    </div>
);

// This is the central router configuration for your entire application.
const router = createBrowserRouter([
    {
        path: '/',
        element: <App />, // The main App component provides the consistent layout (Header, Sidebar)
        errorElement: <ErrorPage />, // This will be displayed if any child route fails to render
        children: [
            // --- Public Routes ---
            { path: '', element: <HomePage /> },
            { path: 'explore', element: <ExplorePage /> },
            { path: 'watch/:videoId', element: <WatchPage /> },
            { path: 'results', element: <SearchResults /> },
            { path: 'login', element: <LoginPage /> },
            { path: 'register', element: <RegisterPage /> },
            { path: 'community', element: <CommunityPage /> }, // Community feed is public
            { path: 'channel/:username', element: <ChannelPage /> },
            { path: 'search-channels', element: <ChannelSearchPage /> },

            // --- Protected Routes (Require Login) ---
            {
                path: 'subscriptions',
                element: <ProtectedRoute><SubscriptionsPage /></ProtectedRoute>
            },
            {
                path: 'history',
                element: <ProtectedRoute><HistoryPage /></ProtectedRoute>
            },
            {
                path: 'playlists',
                element: <ProtectedRoute><PlaylistPage /></ProtectedRoute>
            },
            {
                path: 'playlist/:playlistId',
                element: <ProtectedRoute><PlaylistDetailPage /></ProtectedRoute>
            },
            {
                path: 'my-videos',
                element: <ProtectedRoute><MyVideosPage /></ProtectedRoute>
            },
            {
                path: 'upload-video',
                element: <ProtectedRoute><UploadVideoPage /></ProtectedRoute>
            },
            {
                path: 'creator/dashboard',
                element: <ProtectedRoute><CreatorDashboard /></ProtectedRoute>
            },
            {
                path: 'add-tweet',
                element: <ProtectedRoute><AddTweetPage /></ProtectedRoute>
            },
            { 
                path: 'category/:categoryName', 
                element: <CategoryPage /> 
            },
            { 
                path: 'about',
                element: <AboutPage /> 
            },
            { 
                path: 'channel/:username/about', // New route for the channel's about tab
                element: <ChannelPage /> 
            },
            { 
                path: 'account/edit', // Route for the main Edit Channel page
                element: <ProtectedRoute><EditChannelPage /></ProtectedRoute> 
            },
        ],
    },
]);

export default router;