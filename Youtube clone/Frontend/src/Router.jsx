// src/router.jsx
import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Import all your page components
import HomePage from './components/HomePage.jsx';
import WatchPage from './components/Watchpage.jsx';
import SearchResults from './components/SearchResults.jsx';
import LoginPage from './components/Login.jsx';
import RegisterPage from './components/Register.jsx';
import PlaylistPage from './components/PlaylistPage.jsx';
import PlaylistDetailPage from './components/PlaylistDetailedPage.jsx';
import CreatorDashboard from './components/CreatorDashboard.jsx';
import SubscriptionsPage from './components/SubscriptionsPage.jsx';
import HistoryPage from './components/HistoryPage.jsx';
import CommunityPage from './components/CommunityPage.jsx';
import AddTweetPage from './components/AddTweetPage.jsx';

const router = createBrowserRouter([
    {
        path: '/',
        element: <App />, // The main layout component is the parent
        children: [
            // All these pages will be rendered inside App.jsx's <Outlet />
            { path: '/', element: <HomePage /> },
            { path: '/watch/:videoId', element: <WatchPage /> },
            { path: '/search/:searchQuery', element: <SearchResults /> },
            { path: '/login', element: <LoginPage /> },
            { path: '/register', element: <RegisterPage /> },
            { 
                path: '/playlists', 
                element: <ProtectedRoute><PlaylistPage /></ProtectedRoute> 
            },
            { 
                path: '/playlist/:playlistId', 
                element: <ProtectedRoute><PlaylistDetailPage /></ProtectedRoute> 
            },
            { 
                path: '/creator/dashboard', 
                element: <ProtectedRoute><CreatorDashboard /></ProtectedRoute> 
            },
            { 
                path: '/subscription', // <-- ADD THIS NEW ROUTE
                element: (
                    <ProtectedRoute>
                        <SubscriptionsPage />
                    </ProtectedRoute>
                ),
            },
            { 
                path: '/history', // <-- ADDED
                element: <ProtectedRoute><HistoryPage /></ProtectedRoute> 
            },
            { 
                path: '/community', // <-- ADDED
                element: <ProtectedRoute><CommunityPage /></ProtectedRoute> 
            },
            { 
                path: '/channel/:userId/community',
                element: <CommunityPage /> 
            }, 
            { 
                path: '/add-tweet', 
                element: <ProtectedRoute><AddTweetPage /></ProtectedRoute> 
            },

        ],
    },
]);

export default router;