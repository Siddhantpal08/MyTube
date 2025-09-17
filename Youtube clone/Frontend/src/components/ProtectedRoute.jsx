// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

function ProtectedRoute({ children }) {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    // If the user is not authenticated, redirect them to the /login page
    if (!isAuthenticated) {
        // We also pass the original location they tried to visit.
        // This allows us to redirect them back after they log in.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If the user is authenticated, render the component they were trying to access
    return children;
}

export default ProtectedRoute;