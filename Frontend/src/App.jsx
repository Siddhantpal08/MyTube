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
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setSidebarOpen(prev => !prev);
    };

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

    return (
        <div className="bg-[#0F0F0F] text-white min-h-screen flex flex-col">
            <Toaster 
                position="bottom-center"
                reverseOrder={false}
                toastOptions={{
                    style: { background: '#333', color: '#fff' },
                }}
            />

            <Header onMenuClick={toggleSidebar} />
            
            <div className="flex flex-1 pt-16">
                <Sidebar isOpen={isSidebarOpen} />
                
                {/* --- THE FIX IS HERE --- */}
                {/* This <main> element now uses padding that changes with the sidebar's state. */}
                {/* This allows the content inside (your video grid) to be fully responsive. */}
                <main 
                    className={`flex-1 overflow-y-auto transition-all duration-300 ease-in-out p-4 sm:p-6 lg:p-8 ${isSidebarOpen ? 'md:pl-72' : 'md:pl-28'}`}
                >
                    {/* The Outlet is not constrained by a container, letting pages like HomePage use the full available width for their grids. */}
                    <Outlet />
                </main>
            </div>
            
            <ScrollToTopButton />
            <Footer />
        </div>
    );
}

export default App;