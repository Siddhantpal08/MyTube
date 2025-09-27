import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import axiosClient from '../Api/axiosClient';
import toast from 'react-hot-toast';
import myTubeLogo from '/mytube-logo.png'; // Import logo

function Register() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        fullName: '',
        password: '',
    });
    const [avatar, setAvatar] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setAvatar(e.target.files[0]);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (formData.password.length < 6) {
            toast.error("Password must be at least 6 characters long.");
            return;
        }
        
        setLoading(true);
        setError('');
        const toastId = toast.loading("Creating your account...");

        const submissionData = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            submissionData.append(key, value);
        });
        if (avatar) submissionData.append("avatar", avatar);

        try {
            const response = await axiosClient.post('/users/register', submissionData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            const { user, accessToken } = response.data.data;
            login(user, accessToken);
            toast.success(`Welcome to MyTube, ${user.username}!`, { id: toastId });
            navigate('/');
        } catch (err) {
            const errorMessage = err.response?.data?.message || "Registration failed. Please try again.";
            setError(errorMessage);
            toast.error(errorMessage, { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#0F0F0F] text-white p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-[#1A1A1A] rounded-2xl shadow-2xl border border-gray-800">
                <div className="text-center">
                    <img src={myTubeLogo} alt="MyTube Logo" className="w-12 h-12 mx-auto mb-2" />
                    <h1 className="text-3xl font-bold text-white">Create Your Account</h1>
                    <p className="text-gray-400 mt-2">Join MyTube and start sharing videos!</p>
                </div>
                
                <form onSubmit={handleRegister} className="space-y-4">
                    <InputField label="Username" name="username" type="text" value={formData.username} onChange={handleChange} placeholder="e.g., siddhantpal" required />
                    <InputField label="Full Name" name="fullName" type="text" value={formData.fullName} onChange={handleChange} placeholder="e.g., Siddhant Pal" required />
                    <InputField label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required />
                    <InputField label="Password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="••••••••" required />
                    
                    <div>
                        <label htmlFor="avatar" className="block text-sm font-medium text-gray-300 mb-1">Avatar (Optional)</label>
                        <input
                            type="file"
                            id="avatar"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700 cursor-pointer"
                        />
                    </div>
                    
                    {error && <p className="text-sm text-center text-red-400">{error}</p>}
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 font-bold text-lg text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-gray-900 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div className="text-center text-sm">
                    <p className="text-gray-400">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-red-500 hover:text-red-400">
                            Login here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

// Reusable Input Field Component to keep the form clean
const InputField = ({ label, name, type, value, onChange, placeholder, required }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <input
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
        />
    </div>
);

export default Register;