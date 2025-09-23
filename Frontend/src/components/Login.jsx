// src/components/Login.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom'; // Import Link
import { useAuth } from '../Context/AuthContext'; // Corrected path to lowercase 'context'
import axiosClient from '../Api/axiosClient'; // Corrected path to lowercase 'api'
import toast from 'react-hot-toast'; // Import toast for better notifications

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false); // Add loading state

    // Determines where to redirect after login.
    // Use this to redirect back to the page the user was trying to access.
    const from = location.state?.from?.pathname || "/";

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true); // Set loading true on form submission
        setError(null); // Clear previous errors
        const toastId = toast.loading("Logging in...", {
            style: {
                background: '#333',
                color: '#fff',
            },
        });

        try {
            const response = await axiosClient.post('/users/login', { email, password });
            
            const { user, accessToken, refreshToken } = response.data.data;

            login(user, accessToken, refreshToken); // Call the context login function
            toast.success("Login successful!", { id: toastId }); // Success notification
            navigate(from, { replace: true }); // Navigate back to 'from' page
        } catch (err) {
            const errorMessage = err.response?.data?.message || "Login failed. Please check your credentials.";
            setError(errorMessage);
            toast.error(errorMessage, { id: toastId }); // Error notification
        } finally {
            setLoading(false); // Set loading false after request completes
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <div className="w-full max-w-md p-8 space-y-7 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
                <h1 className="text-3xl font-extrabold text-center text-white">Welcome Back</h1>
                <p className="text-center text-gray-400">Sign in to continue to MyTube</p>
                
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label 
                            htmlFor="email" 
                            className="block text-sm font-medium text-gray-300 mb-1"
                        >
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="your@example.com"
                            className="w-full px-4 py-2 mt-1 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-300 mb-1"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            className="w-full px-4 py-2 mt-1 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                        />
                    </div>
                    
                    {error && <p className="text-sm text-center text-red-400 mt-2">{error}</p>}
                    
                    <button
                        type="submit"
                        disabled={loading} // Disable button when loading
                        className="w-full py-2.5 font-bold text-lg text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Logging In...' : 'Login'}
                    </button>
                </form>

                <div className="text-center text-sm">
                    <Link to="/forgot-password" className="font-medium text-red-500 hover:text-red-400">
                        Forgot Password?
                    </Link>
                    <p className="mt-4 text-gray-400">
                        Don't have an account?{' '}
                        <Link to="/signup" className="font-medium text-red-500 hover:text-red-400">
                            Sign Up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;