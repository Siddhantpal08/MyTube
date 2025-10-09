import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { 
    HomeIcon, ExploreIcon, CommunityIcon, MovieIcon, MusicIcon, TechIcon, GamingIcon, 
    SubscriptionsIcon, HistoryIcon, PlaylistIcon, MyVideosIcon, AboutIcon, SettingsIcon 
} from './Icons';

// Reusable NavItem component with theme-aware styles
const NavItem = ({ to, icon, text, isOpen }) => (
    <NavLink 
        to={to} 
        end={to === "/"}
        className={({ isActive }) => 
            `flex items-center p-3 my-1 rounded-lg transition-colors duration-200 ${
                isActive 
                ? 'bg-gray-200 dark:bg-gray-700 text-black dark:text-white' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-black dark:hover:text-white'
            }`
        }
        title={text}
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

// --- Data for our navigation links ---
const mainLinks = [
    { to: "/", icon: <HomeIcon />, text: "Home" },
    { to: "/explore", icon: <ExploreIcon />, text: "Explore" },
    { to: "/community", icon: <CommunityIcon />, text: "Community" },
];

const categoryLinks = [
    { to: "/category/Latest Movie Trailers", icon: <MovieIcon />, text: "Movies" },
    { to: "/category/Top Music Videos India", icon: <MusicIcon />, text: "Music" },
    { to: "/category/Tech Reviews", icon: <TechIcon />, text: "Tech" },
    { to: "/category/Live Gaming Streams", icon: <GamingIcon />, text: "Gaming" },
];

const userLinks = [
    { to: "/subscriptions", icon: <SubscriptionsIcon />, text: "Subscriptions" },
    { to: "/history", icon: <HistoryIcon />, text: "History" },
    { to: "/playlists", icon: <PlaylistIcon />, text: "Playlists" },
    { to: "/my-videos", icon: <MyVideosIcon />, text: "My Videos" },
];

const secondaryLinks = [
    { to: "/settings", icon: <SettingsIcon />, text: "Settings" },
    { to: "/about", icon: <AboutIcon />, text: "About" },
];

// --- Main Sidebar Component ---
function Sidebar({ isOpen }) {
    const { isAuthenticated } = useAuth();

    const renderNavSection = (links, title) => (
        <>
            {title && <h3 className={`px-3 pt-2 pb-1 text-xs text-gray-500 font-semibold uppercase transition-opacity duration-200 ${!isOpen && 'opacity-0 h-0'}`}>{title}</h3>}
            {links.map(link => <NavItem key={link.to} {...link} isOpen={isOpen} />)}
        </>
    );

    return (
        <aside className={`transition-all duration-300 ease-in-out flex-shrink-0 ${isOpen ? 'w-64' : 'w-20'} bg-white dark:bg-[#0F0F0F] border-r border-gray-200 dark:border-gray-800`}>
            <div className={`p-2 overflow-y-auto h-full scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-gray-100 dark:scrollbar-track-gray-900`}>
                <nav className="flex flex-col">
                    {renderNavSection(mainLinks)}
                    
                    <div className={`border-t my-2 ${!isOpen && 'mx-2'} border-gray-200 dark:border-gray-700`}></div>
                    {renderNavSection(categoryLinks, "Categories")}
                    
                    {isAuthenticated && (
                        <>
                            <div className={`border-t my-2 ${!isOpen && 'mx-2'} border-gray-200 dark:border-gray-700`}></div>
                            {renderNavSection(userLinks, "You")}
                        </>
                    )}

                    <div className={`border-t my-2 ${!isOpen && 'mx-2'} border-gray-200 dark:border-gray-700`}></div>
                    {renderNavSection(secondaryLinks)}
                </nav>
            </div>
        </aside>
    );
}

export default Sidebar;