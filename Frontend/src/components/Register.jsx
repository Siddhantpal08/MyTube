// src/components/Register.jsx (Example structure, update with your full code)
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext'; // Corrected path
import axiosClient from '../Api/axiosClient'; // Corrected path
import toast from 'react-hot-toast'; // Import toast

function Register() {
    const navigate = useNavigate();
    const { login } = useAuth(); // Assuming register also logs in directly
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [avatar, setAvatar] = useState(null);
    const [coverImage, setCoverImage] = useState(null);
    const [loading, setLoading] = useState(false); // Add loading state
    const [error, setError] = useState(null);

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true); // Set loading true
        setError(null); // Clear previous errors
        const toastId = toast.loading("Registering...", {
            style: {
                background: '#333',
                color: '#fff',
            },
        });

        const formData = new FormData();
        formData.append("username", username);
        formData.append("email", email);
        formData.append("fullName", fullName);
        formData.append("password", password);
        if (avatar) formData.append("avatar", avatar);
        if (coverImage) formData.append("coverImage", coverImage);

        try {
            const response = await axiosClient.post('/users/register', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            const { user, accessToken, refreshToken } = response.data.data;
            login(user, accessToken, refreshToken); // Log in directly after registration
            toast.success("Registration successful! Welcome!", { id: toastId });
            navigate('/'); // Navigate to home after successful registration
        } catch (err) {
            const errorMessage = err.response?.data?.message || "Registration failed. Please try again.";
            setError(errorMessage);
            toast.error(errorMessage, { id: toastId });
        } finally {
            setLoading(false); // Set loading false
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <div className="w-full max-w-md p-8 space-y-7 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
                <h1 className="text-3xl font-extrabold text-center text-white">Create Your Account</h1>
                <p className="text-center text-gray-400">Join MyTube and start sharing videos!</p>
                
                <form onSubmit={handleRegister} className="space-y-6">
                    {/* Username Input */}
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            placeholder="myusername"
                            className="w-full px-4 py-2 mt-1 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                        />
                    </div>
                    {/* Full Name Input */}
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                        <input
                            id="fullName"
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            placeholder="Your Full Name"
                            className="w-full px-4 py-2 mt-1 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                        />
                    </div>
                    {/* Email Input */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
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
                    {/* Password Input */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
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
                    {/* Avatar Input */}
                    <div>
                        <label htmlFor="avatar" className="block text-sm font-medium text-gray-300 mb-1">Avatar (Optional)</label>
                        <input
                            type="file"
                            id="avatar"
                            accept="image/*"
                            onChange={(e) => setAvatar(e.target.files[0])}
                            className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-500 file:text-white hover:file:bg-red-600"
                        />
                        {avatar && <p className="text-sm text-gray-400 mt-1">Selected: {avatar.name}</p>}
                    </div>
                    {/* Cover Image Input */}
                    <div>
                        <label htmlFor="coverImage" className="block text-sm font-medium text-gray-300 mb-1">Cover Image (Optional)</label>
                        <input
                            type="file"
                            id="coverImage"
                            accept="image/*"
                            onChange={(e) => setCoverImage(e.target.files[0])}
                            className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-white file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-500 file:text-white hover:file:bg-red-600"
                        />
                        {coverImage && <p className="text-sm text-gray-400 mt-1">Selected: {coverImage.name}</p>}
                    </div>
                    
                    {error && <p className="text-sm text-center text-red-400 mt-2">{error}</p>}
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 font-bold text-lg text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>

                <div className="text-center text-sm mt-4">
                    <p className="text-gray-400">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-red-500 hover:text-red-400">
                            Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Register;