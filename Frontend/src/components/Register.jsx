import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import axiosClient from '../Api/axiosClient';
import toast from 'react-hot-toast';
import myTubeLogo from '/mytube-logo.png';

// Reusable Input Field Component
const InputField = ({ label, name, type, value, onChange, autoComplete, required }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <input 
            id={name} name={name} type={type} value={value} onChange={onChange} 
            autoComplete={autoComplete} 
            required={required}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200" 
        />
    </div>
);

// Reusable File Input Component
const FileInput = ({ label, name, onChange, fileName }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <div className="mt-1 flex items-center">
            <label htmlFor={name} className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                Choose File
            </label>
            <input type="file" id={name} name={name} accept="image/*" onChange={onChange} className="hidden" />
            {fileName && <span className="ml-3 text-sm text-gray-400">{fileName}</span>}
        </div>
    </div>
);

function Register() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({ username: '', email: '', fullName: '', password: '' });
    const [avatar, setAvatar] = useState(null);
    const [coverImage, setCoverImage] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        const file = files[0];
        if (file) {
            if (name === 'avatar') {
                setAvatar(file);
                setAvatarPreview(URL.createObjectURL(file));
            } else if (name === 'coverImage') {
                setCoverImage(file);
            }
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (formData.password.length < 6) {
            return toast.error("Password must be at least 6 characters long.");
        }
        
        setLoading(true);
        setError('');
        const toastId = toast.loading("Creating your account...");

        const submissionData = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            submissionData.append(key, value);
        });
        if (avatar) submissionData.append("avatar", avatar);
        if (coverImage) submissionData.append("coverImage", coverImage);

        try {
            // Step 1: Register the user
            await axiosClient.post('/users/register', submissionData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            // Step 2: Automatically log the user in after a successful registration
            const loginResponse = await axiosClient.post('/users/login', { 
                email: formData.email, 
                password: formData.password 
            });
            const { user, accessToken } = loginResponse.data.data;
            login(user, accessToken); // This updates your AuthContext

            toast.success(`Welcome to MyTube, ${user.username}!`, { id: toastId });
            navigate('/'); // Redirect to the homepage

        } catch (err) {
            const errorMessage = err.response?.data?.message || "Registration failed. Please check the details and try again.";
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
                    <div className="flex justify-center">
                        <label htmlFor="avatar" className="cursor-pointer">
                            <img 
                                src={avatarPreview || `https://api.dicebear.com/8.x/initials/svg?seed=${formData.fullName || formData.username || '?'}`} 
                                alt="Avatar Preview" 
                                className="w-24 h-24 rounded-full object-cover border-2 border-gray-600 hover:border-red-500 transition-colors"
                            />
                        </label>
                        <input type="file" id="avatar" name="avatar" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </div>
                    
                    <InputField label="Full Name" name="fullName" type="text" value={formData.fullName} onChange={handleChange} autoComplete="name" required />
                    <InputField label="Username" name="username" type="text" value={formData.username} onChange={handleChange} autoComplete="username" required />
                    <InputField label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} autoComplete="email" required />
                    <InputField label="Password" name="password" type="password" value={formData.password} onChange={handleChange} autoComplete="new-password" required />
                    <FileInput label="Cover Image (Optional)" name="coverImage" onChange={handleFileChange} fileName={coverImage?.name} />
                    
                    {error && <p className="text-sm text-center text-red-400">{error}</p>}
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 font-bold text-lg text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-gray-900 transition-colors duration-200 disabled:opacity-50"
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div className="text-center text-sm">
                    <p className="text-gray-400">Already have an account?{' '}
                        <Link to="/login" className="font-medium text-red-500 hover:text-red-400">Login here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Register;