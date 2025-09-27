import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import axiosClient from '../Api/axiosClient';
import toast from 'react-hot-toast';
import myTubeLogo from '/mytube-logo.png';

function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation(); // 1. Get the location object to access state
    const { login } = useAuth();

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // 2. Determine where to redirect after a successful login
    // If the user was sent here from a protected route, 'from.pathname' will exist.
    // Otherwise, we default to the homepage '/'.
    const from = location.state?.from?.pathname || "/";

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const toastId = toast.loading("Logging in...");

        try {
            const response = await axiosClient.post('/users/login', {
                email: formData.email,
                password: formData.password
            });

            const { user, accessToken } = response.data.data;
            login(user, accessToken);
            toast.success(`Welcome back, ${user.username}!`, { id: toastId });
            
            // 3. Navigate to the original destination or the homepage
            navigate(from, { replace: true });

        } catch (err) {
            const errorMessage = err.response?.data?.message || "Login failed. Please check your credentials.";
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
                    <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
                    <p className="text-gray-400 mt-2">Sign in to continue to MyTube</p>
                </div>
                
                <form onSubmit={handleLogin} className="space-y-4">
                    <InputField label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required />
                    <InputField label="Password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="••••••••" required />
                    
                    {error && <p className="text-sm text-center text-red-400">{error}</p>}
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 font-bold text-lg text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-gray-900 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <div className="text-center text-sm">
                    <p className="text-gray-400">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-medium text-red-500 hover:text-red-400">
                            Register now
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

// Reusable Input Field Component
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

export default LoginPage;