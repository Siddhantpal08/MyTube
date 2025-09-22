// src/components/Header.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

// --- A small, reusable Icon component ---
const Icon = ({ path, className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
);

function Header() {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();

    // --- State Management ---
    const [searchQuery, setSearchQuery] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const dropdownRef = useRef(null); // Ref to detect clicks outside the dropdown

    // --- Event Handlers ---
    const handleLogout = () => {
        logout();
        setIsDropdownOpen(false);
        setIsMobileMenuOpen(false);
        navigate('/');
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        navigate(`/search/${searchQuery}`);
        setSearchQuery("");
    };

    // Close dropdown when clicking outside of it
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    return (
        <header className="bg-gray-900/80 text-white shadow-lg sticky top-0 z-50 backdrop-blur-sm">
            <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold text-indigo-400 hover:text-indigo-300">MyTube</Link>
                
                {/* --- Search Bar (Desktop) --- */}
                <div className="hidden md:block w-1/3">
                    {/* ... your search form ... */}
                </div>

                {/* --- User Menu (Desktop) --- */}
                <div className="hidden md:flex items-center space-x-4">
                    {isAuthenticated ? (
                        <div className="relative" ref={dropdownRef}>
                            <button onClick={() => setIsDropdownOpen(prev => !prev)} className="flex items-center gap-2">
                                <img src={user?.avatar} alt={user?.username} className="w-10 h-10 rounded-full border-2 border-transparent hover:border-indigo-400" />
                            </button>
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1">
                                    <div className="px-4 py-2 text-sm text-indigo-400">{user?.username}</div>
                                    <div className="border-t border-gray-700"></div>
                                    
                                    {/* UPDATED LINKS */}
                                    <Link to="/community" className="block px-4 py-2 text-sm hover:bg-gray-700">Community Feed</Link>
                                    <Link to="/creator/dashboard" className="block px-4 py-2 text-sm hover:bg-gray-700">Studio</Link>

                                    <div className="border-t border-gray-700"></div>
                                    <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-gray-700">Logout</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <Link to="/login" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition-colors">Login</Link>
                            <Link to="/register" className="font-semibold hover:text-indigo-400">Register</Link>
                        </>
                    )}
                </div>
                
                {/* --- Mobile Menu Button --- */}
                <div className="md:hidden">
                    <button onClick={() => setIsMobileMenuOpen(prev => !prev)}>
                        <Icon path={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"} />
                    </button>
                </div>
            </nav>

            {/* --- Mobile Menu --- */}
            {isMobileMenuOpen && (
                <div className="md:hidden px-4 pt-2 pb-4 space-y-2">
                     <form onSubmit={handleSearch} className="flex mb-4">
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="w-full px-4 py-2 text-gray-900 bg-gray-200 rounded-l-full focus:outline-none"/>
                        <button type="submit" className="bg-gray-700 text-white p-2 rounded-r-full"><Icon path="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></button>
                    </form>
                    {isAuthenticated ? (
                        <>
                            <Link to="/subscription" className="block py-2 text-center rounded-md hover:bg-gray-700">Subscription</Link>
                            <Link to="/playlist" className="block py-2 text-center rounded-md hover:bg-gray-700">My Playlists</Link>
                            <Link to="/creator/dashboard" className="block py-2 text-center rounded-md hover:bg-gray-700">Studio</Link>
                            <button onClick={handleLogout} className="w-full block py-2 text-center text-red-400 rounded-md hover:bg-gray-700">Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="block py-2 text-center bg-indigo-600 rounded-md hover:bg-indigo-700">Login</Link>
                            <Link to="/register" className="block py-2 text-center rounded-md hover:bg-gray-700">Register</Link>
                        </>
                    )}
                </div>
            )}
        </header>
    );
}

export default Header;