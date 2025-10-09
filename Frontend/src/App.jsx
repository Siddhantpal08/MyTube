import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from './Context/AuthContext';
import { useTheme } from './Context/ThemeContext'; // Import the useTheme hook
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import ScrollToTopButton from './components/ScrollToTopButton';

function App() {
    const { loading } = useAuth();
    const { theme } = useTheme(); // Get the current theme from your context
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setSidebarOpen(prev => !prev);
    };

    // Dynamically set toast styles based on the current theme
    const toastOptions = {
        style: {
            background: theme === 'dark' ? '#333' : '#E5E7EB', // Dark gray for dark, light gray for light
            color: theme === 'dark' ? '#fff' : '#111827', // White text for dark, dark gray for light
        },
    };

    if (loading) {
        return (
            // Apply theme classes to your loading screen
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#0F0F0F] text-gray-900 dark:text-white">
                <div className="text-center">
                    <img src="/mytube-logo.png" alt="Loading MyTube" className="h-16 w-auto mx-auto mb-4 animate-pulse" />
                    <h1 className="text-2xl font-semibold">Initializing Session...</h1>
                </div>
            </div>
        );
    }

    return (
        // Apply theme classes to the main application layout
        <div className="h-screen flex flex-col bg-gray-50 dark:bg-[#0F0F0F] text-gray-900 dark:text-white transition-colors duration-200">
            <Toaster 
                position="bottom-center"
                reverseOrder={false}
                toastOptions={toastOptions} // Use the dynamic toast styles
            />

            <Header onMenuClick={toggleSidebar} />
            
            <div className="flex flex-1 overflow-hidden pt-16">
                <Sidebar isOpen={isSidebarOpen} />
                
                <main className="flex-1 overflow-y-auto">
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