import React from "react";
import { useLocation, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading state until auth check is done
  if (loading) {
    return <div className="text-center p-8">Checking authentication...</div>;
  }

  // If authenticated, render the requested page
  if (isAuthenticated) {
    return children || <Outlet />;
  }

  // If NOT authenticated, redirect to login with redirect info
  return <Navigate to="/login" state={{ from: location }} replace />;
}

export default ProtectedRoute;