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
            
            {/* --- THIS IS THE FINAL LAYOUT FIX --- */}
            <div className="flex flex-1 pt-16">
                {/* 1. The Sidebar is now a direct flex item that controls its own width. */}
                <Sidebar isOpen={isSidebarOpen} />
                
                {/* 2. The Main content area has `flex-1` which makes it automatically take up all remaining space. */}
                <main className="flex-1 overflow-y-auto">
                    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <Outlet />
                    </div>
                    <Footer />
                </main>
            </div>
            
            {/* 3. The ScrollToTopButton is outside the flex container so it can be positioned correctly. */}
            <ScrollToTopButton />
        </div>
    );
}

export default App;