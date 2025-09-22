// src/components/Register.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../Api/axiosClient';

function Register() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState(null);
    const [avatar, setAvatar] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setAvatar(e.target.files[0]);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError(null);

        // Basic validation
        if (!formData.fullName || !formData.username || !formData.email || !formData.password || !avatar) {
            setError("All fields are required.");
            return;
        }

        const registrationData = new FormData();
        registrationData.append("fullName", formData.fullName);
        registrationData.append("username", formData.username);
        registrationData.append("email", formData.email);
        registrationData.append("password", formData.password);
        registrationData.append("avatar", avatar);

        try {
            const response = await axiosClient.post('/users/register', registrationData);
            
            const loginResponse = await axiosClient.post('/users/login', {
                email: formData.email,
                password: formData.password,
            });

            const { user, accessToken } = loginResponse.data.data;
            login(user, accessToken); 
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed. Please try again.");
            console.error("Registration error:", err);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
            <div className="w-full max-w-md p-8 space-y-4 bg-gray-800 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center">Create an Account</h1>
                
                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Full Name</label>
                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Avatar</label>
                        <input
                            type="file"
                            name="avatar"
                            onChange={handleFileChange}
                            required
                            className="w-full px-3 py-2 mt-1 text-gray-300 bg-gray-700 border border-gray-600 rounded-md file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300">Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    {error && <p className="text-sm text-center text-red-500">{error}</p>}
                    <button
                        type="submit"
                        className="w-full py-2 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                    >
                        Register
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Register;