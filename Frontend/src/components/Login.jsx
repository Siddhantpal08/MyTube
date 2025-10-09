import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext.jsx'; 
import axiosClient from '../Api/axiosClient';
import toast from 'react-hot-toast';
import myTubeLogo from '/mytube-logo.png'; // Assuming this is correct if served from root, otherwise needs adjustment

// --- Reusable Input Field Component ---
const InputField = ({ label, name, type, value, onChange, autoComplete, error }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
            {label}
        </label>
        <input
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            autoComplete={autoComplete}
            required
            className={`w-full px-4 py-2 rounded-lg border transition-colors duration-200 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700 focus:ring-red-500'}`}
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
);


// --- Main Login Page Component ---
function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        emailOrUsername: '',
        password: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState('');

    // Determine where to redirect after a successful login
    const from = location.state?.from?.pathname || "/";

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear validation error on change
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    // --- Client-Side Validation Logic ---
    const validateForm = () => {
        const newErrors = {};
        if (!formData.emailOrUsername.trim()) {
            newErrors.emailOrUsername = "Email or Username is required.";
        }
        if (!formData.password) {
            newErrors.password = "Password is required.";
        } else if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters long.";
        }
        return newErrors;
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setServerError(''); // Reset server error on new submission

        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }

        setLoading(true);
        const toastId = toast.loading("Logging in...");
        
        // --- Backend Data Key FIX ---
        // This logic correctly maps the single frontend field to the two backend keys.
        const loginIdentifier = formData.emailOrUsername.trim();
        const isEmail = loginIdentifier.includes('@'); 

        // Construct the payload with the keys the backend expects (email and username)
        const payload = {
            password: formData.password,
            email: isEmail ? loginIdentifier : undefined,
            username: !isEmail ? loginIdentifier : undefined,
        };
        // -----------------------------

        try {
            // Send the corrected payload
            const response = await axiosClient.post('/users/login', payload);

            const { user, accessToken } = response.data.data;
            login(user, accessToken); // Update auth context

            toast.success(`Welcome back, ${user.username}!`, { id: toastId });
            
            // Navigate to the original destination or the homepage
            navigate(from, { replace: true });

        } catch (err) {
            // Extract the specific message from the server for better user feedback
            const errorMessage = err.response?.data?.message || "Login failed. Please check your credentials.";
            setServerError(errorMessage);
            toast.error(errorMessage, { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#0F0F0F] p-4 transition-colors duration-200">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800">
                
                <div className="text-center">
                    {/* Assuming myTubeLogo path is correct */}
                    <img src={myTubeLogo} alt="MyTube Logo" className="w-12 h-12 mx-auto mb-2" />
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Sign in to continue to MyTube</p>
                </div>
                
                <form onSubmit={handleLogin} className="space-y-4">
                    <InputField
                        label="Email or Username"
                        name="emailOrUsername" // Frontend form key
                        type="text"
                        value={formData.emailOrUsername}
                        onChange={handleChange}
                        autoComplete="username"
                        error={errors.emailOrUsername}
                    />
                    <InputField
                        label="Password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        autoComplete="current-password"
                        error={errors.password}
                    />

                    {serverError && <p className="text-sm text-center text-red-500 dark:text-red-400">{serverError}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 font-bold text-lg text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <div className="text-center text-sm">
                    <p className="text-gray-500 dark:text-gray-400">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-medium text-red-600 hover:text-red-500 dark:text-red-500 dark:hover:text-red-400">
                            Register now
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;