    // src/context/AuthContext.jsx
    import React from 'react';
    import { createContext, useState, useContext, useEffect } from 'react';
    import axiosClient from '../Api/axiosClient';

    const AuthContext = createContext();

    export const AuthProvider = ({ children }) => {
        const [user, setUser] = useState(null);
        const [loading, setLoading] = useState(true); // Start as true

        // This effect now ONLY runs ONCE when the app first loads
        useEffect(() => {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setLoading(false);
                return;
            }

            axiosClient.get('/users/current-user')
                .then(response => {
                    setUser(response.data.data);
                })
                .catch(() => {
                    // If the token is invalid, clear it
                    localStorage.removeItem('accessToken');
                    setUser(null);
                })
                .finally(() => {
                    setLoading(false);
                });
        }, []); // <-- The empty dependency array is the key fix

        const login = (userData, accessToken, refreshToken) => {
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken); // <-- Store the refresh token
            setUser(userData);
        };

        const logout = () => {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken'); // <-- Remove the refresh token
            setUser(null);
        };

        const value = {
            user,
            loading,
            login,
            logout,
            isAuthenticated: !!user,
        };

        return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
    };

    export const useAuth = () => {
        return useContext(AuthContext);
    };