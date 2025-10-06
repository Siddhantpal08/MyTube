import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

// The NavItem now knows how to hide its text when the sidebar is closed
const NavItem = ({ to, icon, text, isOpen, end = false }) => (
    <NavLink 
        to={to} 
        end={to === "/"}
        className={({ isActive }) => 
            `flex items-center p-4 rounded-lg hover:bg-gray-800 transition-colors ${isActive ? 'bg-gray-700 text-white' : 'text-gray-300'}`
        }
        title={text} // Show full text on hover when closed
    >
        {icon}
        <span className={`ml-4 font-medium transition-opacity duration-200 ${!isOpen && 'md:hidden'}`}>
            {text}
        </span>
    </NavLink>
);

// --- SVG Icons (Your existing icons go here) ---
const HomeIcon = () => <svg /* ... */ />;
const ExploreIcon = () => <svg /* ... */ />;
// ... include all your other icon components

function Sidebar({ isOpen }) {
    const { isAuthenticated } = useAuth();

    return (
        // --- THE FIX: Class names now handle the mini-sidebar state ---
        <aside 
            className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-[#0F0F0F] border-r border-gray-800 transform transition-all duration-300 ease-in-out z-40 
            ${isOpen ? 'w-64' : 'w-0 md:w-20'} 
            ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        >
            <div className="p-2 overflow-y-auto h-full scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                <nav className="flex flex-col space-y-2">
                    {/* Pass the 'isOpen' prop down to each NavItem */}
                    <NavItem to="/" icon={<HomeIcon />} text="Home" isOpen={isOpen} />
                    <NavItem to="/explore" icon={<ExploreIcon />} text="Explore" isOpen={isOpen} />
                    <NavItem to="/community" icon={<CommunityIcon />} text="Community" isOpen={isOpen} />
                    
                    <div className="border-t border-gray-700 my-4"></div>
                    
                    {/* The h3 is hidden when the sidebar is in its mini state */}
                    <h3 className={`px-4 pt-2 pb-1 text-xs text-gray-500 font-semibold uppercase ${!isOpen && 'md:hidden'}`}>Categories</h3>
                    <NavItem to="/category/Latest Movie Trailers" icon={<MovieIcon />} text="Movies" isOpen={isOpen} />
                    {/* ... other category NavItems ... */}
                    
                    {isAuthenticated && (
                        <>
                            <div className="border-t border-gray-700 my-4"></div>
                            <h3 className={`px-4 pt-2 pb-1 text-xs text-gray-500 font-semibold uppercase ${!isOpen && 'md:hidden'}`}>You</h3>
                            <NavItem to="/subscriptions" icon={<SubscriptionsIcon />} text="Subscriptions" isOpen={isOpen} />
                            {/* ... other authenticated NavItems ... */}
                        </>
                    )}
                </nav>
            </div>
        </aside>
    );
}

export default Sidebar;