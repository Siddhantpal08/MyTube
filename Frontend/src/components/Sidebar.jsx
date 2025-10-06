import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

// This new NavItem is smarter. It knows how to hide its text and center its icon when collapsed.
const NavItem = ({ to, icon, text, isOpen, end = false }) => (
    <NavLink 
        to={to} 
        end={to === "/"}
        className={({ isActive }) => 
            `flex items-center p-3 my-1 rounded-lg transition-colors duration-200 ${isActive ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`
        }
        title={text} // This shows the full text on hover when the sidebar is closed
    >
        <div className={`flex-shrink-0 transition-all duration-300 ${!isOpen && 'mx-auto'}`}>
            {icon}
        </div>
        <span 
            className={`ml-4 font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}
        >
            {text}
        </span>
    </NavLink>
);

// --- ALL SVG ICONS ---
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const ExploreIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" /></svg>;
const CommunityIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const MovieIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const MusicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg>;
const TechIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 16v-2m8-8h2M4 12H2m15.364 6.364l1.414 1.414M4.222 4.222l1.414 1.414m12.728 0l-1.414 1.414M5.636 18.364l-1.414 1.414M12 18a6 6 0 100-12 6 6 0 000 12z" /></svg>;
const GamingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5-5 5h10zM13 7l5 5 5-5H13z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l5-5-5-5v10zM17 7l-5 5 5 5V7z" /></svg>;
const SubscriptionsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3h2m0 0h2" /></svg>;
const HistoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const PlaylistIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>;
const MyVideosIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;


function Sidebar({ isOpen }) {
    const { isAuthenticated } = useAuth();
    return (
        // It is no longer 'fixed'. It is a flex item that changes its width.
        // `flex-shrink-0` is essential to prevent it from being squished.
        <aside className={`transition-all duration-300 ease-in-out bg-[#0F0F0F] border-r border-gray-800 flex-shrink-0 ${isOpen ? 'w-64' : 'w-20'}`}>
            <div className="p-2 overflow-y-auto h-full scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                <nav className="flex flex-col space-y-1">
                    <NavItem to="/" icon={<HomeIcon />} text="Home" isOpen={isOpen} />
                    <NavItem to="/explore" icon={<ExploreIcon />} text="Explore" isOpen={isOpen} />
                    <NavItem to="/community" icon={<CommunityIcon />} text="Community" isOpen={isOpen} />
                    
                    <div className={`border-t border-gray-700 my-2 ${!isOpen && 'mx-2'}`}></div>
                    
                    <h3 className={`px-3 pt-2 pb-1 text-xs text-gray-500 font-semibold uppercase transition-opacity duration-200 ${!isOpen && 'opacity-0 h-0'}`}>Categories</h3>
                    <NavItem to="/category/Latest Movie Trailers" icon={<MovieIcon />} text="Movies" isOpen={isOpen} />
                    <NavItem to="/category/Top Music Videos India" icon={<MusicIcon />} text="Music" isOpen={isOpen} />
                    <NavItem to="/category/Tech Reviews" icon={<TechIcon />} text="Tech" isOpen={isOpen} />
                    <NavItem to="/category/Live Gaming Streams" icon={<GamingIcon />} text="Gaming" isOpen={isOpen} />
                    
                    {isAuthenticated && (
                        <>
                            <div className={`border-t border-gray-700 my-2 ${!isOpen && 'mx-2'}`}></div>
                            <h3 className={`px-3 pt-2 pb-1 text-xs text-gray-500 font-semibold uppercase transition-opacity duration-200 ${!isOpen && 'opacity-0 h-0'}`}>You</h3>
                            <NavItem to="/subscriptions" icon={<SubscriptionsIcon />} text="Subscriptions" isOpen={isOpen} />
                            <NavItem to="/history" icon={<HistoryIcon />} text="History" isOpen={isOpen} />
                            <NavItem to="/playlists" icon={<PlaylistIcon />} text="Playlists" isOpen={isOpen} />
                            <NavItem to="/my-videos" icon={<MyVideosIcon />} text="My Videos" isOpen={isOpen} />
                        </>
                    )}
                </nav>
            </div>
        </aside>
    );
}

export default Sidebar;