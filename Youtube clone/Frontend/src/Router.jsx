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
        ],
    },
]);

export default router;