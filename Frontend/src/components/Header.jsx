import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import myTubeLogo from '/mytube-logo.png';
import { placeholderAvatar } from '../utils/formatters';

const Icon = ({ path, className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
);

const MenuIcon = () => <Icon path="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />;

function Header({ onMenuClick }) {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/results?search_query=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery("");
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#0F0F0F] h-16 flex items-center justify-between px-4 border-b border-gray-800">
            {/* ... Left side and search bar ... */}
            <div className="flex items-center space-x-4">
                {isAuthenticated ? (
                    <div className="relative" ref={dropdownRef}>
                        <button onClick={() => setIsDropdownOpen(prev => !prev)}>
                            <img 
                                src={user?.avatar?.url || placeholderAvatar} 
                                alt={user?.username} 
                                className="w-10 h-10 rounded-full border-2 border-transparent hover:border-red-500 object-cover" 
                            />
                        </button>
                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1">
                                <div className="px-4 py-2 text-sm text-red-400">{user?.username}</div>
                                <div className="border-t border-gray-700"></div>
                                <Link to={`/channel/${user?.username}`} onClick={() => setIsDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">Your Channel</Link>
                                <Link to="/creator/dashboard" onClick={() => setIsDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">Studio</Link>
                                <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-gray-700">Logout</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="hidden md:flex items-center space-x-2">
                         <Link to="/login" className="bg-transparent text-red-500 border border-red-500 px-4 py-2 rounded-md text-sm font-semibold hover:bg-red-500 hover:text-white transition-colors">Login</Link>
                         <Link to="/register" className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-red-600 transition-colors">Register</Link>
                    </div>
                )}
            </div>
        </header>
    );
}

export default Header;