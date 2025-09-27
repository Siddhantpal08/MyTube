import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

const NavItem = ({ to, icon, text }) => (
    <NavLink 
        to={to} 
        className={({ isActive }) => 
            `flex items-center px-4 py-3 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors ${isActive ? 'bg-gray-700 text-white' : ''}`
        }
    >
        {icon}
        <span className="ml-4 font-medium">{text}</span>
    </NavLink>
);

// Placeholder SVG icons
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const SubscriptionsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3h2m0 0h2" /></svg>;
const HistoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

function Sidebar({ isOpen }) {
    const { isAuthenticated } = useAuth();

    return (
        <aside 
            className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-[#0F0F0F] border-r border-gray-800 transform transition-transform duration-300 ease-in-out z-40 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
            <div className="p-4">
                <nav className="space-y-2">
                    <NavItem to="/" icon={<HomeIcon />} text="Home" />
                    {isAuthenticated && (
                        <>
                            <NavItem to="/subscriptions" icon={<SubscriptionsIcon />} text="Subscriptions" />
                            <NavItem to="/history" icon={<HistoryIcon />} text="History" />
                        </>
                    )}
                </nav>
            </div>
        </aside>
    );
}

export default Sidebar;