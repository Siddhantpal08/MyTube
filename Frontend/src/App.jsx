import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from './Context/AuthContext';
import { Toaster } from 'react-hot-toast';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import ScrollToTopButton from './components/ScrollToTopButton';

function App() {
    const { loading } = useAuth();
    // 1. The state for the sidebar is managed here, in the parent component.
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    // 2. This function will be passed down to the Header component to toggle the sidebar's state.
    const toggleSidebar = () => {
        setSidebarOpen(prev => !prev);
    };

    // Display a full-screen loader while the authentication state is being determined.
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0F0F0F] text-white">
                <div className="text-center">
                    <img src="/mytube-logo.png" alt="Loading MyTube" className="h-16 w-auto mx-auto mb-4 animate-pulse" />
                    <h1 className="text-2xl font-semibold">Initializing Session...</h1>
                </div>
            </div>
        );
    }

    // Once loaded, render the full application layout.
    return (
        <div className="bg-[#0F0F0F] text-white min-h-screen flex flex-col">
            <Toaster 
                position="bottom-center"
                reverseOrder={false}
                toastOptions={{
                    style: { background: '#333', color: '#fff' },
                }}
            />

            {/* 3. The toggle function is passed as a prop to the Header. */}
            <Header onMenuClick={toggleSidebar} />
            
            <div className="flex flex-1 pt-16">
                {/* 4. The `isOpen` state is passed to the Sidebar to control its visibility. */}
                <Sidebar isOpen={isSidebarOpen} />
                
                {/* --- THE FIX for responsive layout is here --- */}
                {/* 5. The main content area now uses padding (`pl`) instead of margin (`ml`). */}
                {/* This allows the grid inside to expand and fill the space. */}
                               <main 
                    className={`flex-1 transition-all duration-300 ease-in-out overflow-y-auto ${isSidebarOpen ? 'md:pl-64' : 'md:pl-20'}`}
                >
                    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <Outlet />
                    </div>
                    <Footer />
                </main>
            </div>
            
            <ScrollToTopButton />
        </div>
    );
}

export default App;