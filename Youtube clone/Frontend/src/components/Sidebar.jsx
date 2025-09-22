// src/components/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

// Reusable component for a navigation item
const NavItem = ({ to, icon, text }) => (
    <NavLink 
        to={to} 
        className={({ isActive }) => 
            `flex items-center px-4 py-2 text-gray-300 rounded-lg hover:bg-gray-700 ${isActive ? 'bg-gray-700 text-white' : ''}`
        }
    >
        {icon}
        <span className="ml-3">{text}</span>
    </NavLink>
);

// Placeholder SVG icons
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const SubscriptionsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3h2m0 0h2" /></svg>;
const HistoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const PlaylistIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>;
const CommunityIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;


function Sidebar() {
    const { isAuthenticated } = useAuth();

    return (
        // This sidebar will be hidden on mobile (screens smaller than `md`)
        <aside className="hidden md:block w-64 flex-shrink-0 bg-gray-900 p-4 sticky top-[76px] h-[calc(100vh-76px)]">
            <nav className="space-y-2">
                <NavItem to="/" icon={<HomeIcon />} text="Home" />
                
                {/* These links only show if the user is logged in */}
                {isAuthenticated && (
                    <>
                        <NavItem to="/subscription" icon={<SubscriptionsIcon />} text="Subscriptions" />
                        <NavItem to="/history" icon={<HistoryIcon />} text="History" />
                        <NavItem to="/playlists" icon={<PlaylistIcon />} text="Playlists" />
                        <NavItem to="/community" icon={<CommunityIcon />} text="Community" />
                    </>
                )}
            </nav>
        </aside>
    );
}

export default Sidebar;