import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

const NavItem = ({ to, icon, text, end = true }) => (
    <NavLink to={to} end={end} className={({ isActive }) => `flex items-center px-4 py-3 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors ${isActive ? 'bg-gray-700 text-white' : ''}`}>
        {icon}
        <span className="ml-4 font-medium">{text}</span>
    </NavLink>
);

// --- SVG Icons ---
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const ExploreIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" /></svg>;
const SubscriptionsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3h2m0 0h2" /></svg>;
const HistoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const PlaylistIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>;
const MyVideosIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

function Sidebar({ isOpen }) {
    const { isAuthenticated } = useAuth();
    return (
        <aside className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-[#0F0F0F] border-r border-gray-800 transform transition-transform duration-300 ease-in-out z-40 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-4 overflow-y-auto h-full">
                <nav className="flex flex-col space-y-2">
                    <NavItem to="/" icon={<HomeIcon />} text="Home" />
                    <NavItem to="/explore" icon={<ExploreIcon />} text="Explore" />
                    <div className="border-t border-gray-700 my-4"></div>
                    {isAuthenticated && (
                        <>
                            <h3 className="px-4 pt-2 pb-1 text-xs text-gray-500 font-semibold uppercase">You</h3>
                            <NavItem to="/subscriptions" icon={<SubscriptionsIcon />} text="Subscriptions" />
                            <NavItem to="/history" icon={<HistoryIcon />} text="History" />
                            <NavItem to="/playlists" icon={<PlaylistIcon />} text="Playlists" />
                            <NavItem to="/my-videos" icon={<MyVideosIcon />} text="My Videos" />
                        </>
                    )}
                </nav>
            </div>
        </aside>
    );
}

export default Sidebar;