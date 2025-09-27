import React from 'react';
import { useLocation, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation(); // 1. Get the current location

    // If the authentication state is still loading, you can show a loader
    if (loading) {
        return <div className="text-center p-8">Checking authentication...</div>;
    }

    // 2. If the user is authenticated, render the child component they were trying to access.
    // 'children' is the prop passed from your router (e.g., <PlaylistPage />).
    if (isAuthenticated) {
        return children || <Outlet />;
    }

    // 3. If the user is NOT authenticated, redirect them to the login page.
    // We pass the current location in the 'state' object.
    // The Login page can then use this state to redirect back after a successful login.
    return <Navigate to="/login" state={{ from: location }} replace />;
}

export default ProtectedRoute;