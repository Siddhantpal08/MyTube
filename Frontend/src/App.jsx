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
                    style: {
                        background: '#333',
                        color: '#fff',
                    },
                }}
            />

            <Header onMenuClick={toggleSidebar} />
            
            <div className="flex flex-1 pt-16">
                <div className="flex-shrink-0">
                    <Sidebar isOpen={isSidebarOpen} />
                </div>
                
                <main 
                    className={`flex-1 transition-all duration-300 ease-in-out overflow-y-auto ${isSidebarOpen ? 'md:ml-64' : 'ml-0'}`}
                >
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
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