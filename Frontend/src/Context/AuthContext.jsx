import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../Api/axiosClient';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true); // Start with loading true

    useEffect(() => {
        // This effect runs once when the app starts
        const checkUserStatus = async () => {
            const token = localStorage.getItem('accessToken');
            if (token) {
                // Set the token for all subsequent requests
                axiosClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                try {
                    // Verify the token by fetching the current user
                    const response = await axiosClient.get('/users/current-user');
                    setUser(response.data.data);
                    setIsAuthenticated(true);
                } catch (error) {
                    // Token is invalid or expired
                    console.error("Session check failed, logging out.", error);
                    logout(); // Clear invalid state
                }
            }
            setLoading(false); // Finished checking
        };
        checkUserStatus();
    }, []);

    const login = (userData, token) => {
        localStorage.setItem('accessToken', token);
        axiosClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);
        setIsAuthenticated(true);
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        delete axiosClient.defaults.headers.common['Authorization'];
        setUser(null);
        setIsAuthenticated(false);
    };

    const value = {
        user,
        isAuthenticated,
        loading,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};