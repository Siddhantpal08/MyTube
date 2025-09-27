import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './Context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';

// A new component to contain the layout logic
// This component now lives INSIDE AuthProvider, so it can safely use useAuth()
const AppLayout = () => {
    const { loading } = useAuth();
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    const toggleSidebar = () => setSidebarOpen(prev => !prev);

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
            <Toaster position="bottom-center" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
            <Header onMenuClick={toggleSidebar} />
            <div className="flex flex-1 pt-16">
                <Sidebar isOpen={isSidebarOpen} />
                <main className={`flex-1 transition-all duration-300 ease-in-out overflow-y-auto ${isSidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
                    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <Outlet />
                    </div>
                    <Footer />
                </main>
            </div>
        </div>
    );
};

// The main App component's only job is to provide the AuthContext
// because it is rendered by the router, all its children now have access to both.
function App() {
  return (
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  );
}

export default App;