// src/App.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from './Context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTopButton from './components/ScrollToTopButton'; 

import Sidebar from './components/Sidebar';

function App() {
    const { loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
                <h1 className="text-2xl">Loading Application...</h1>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col overflow-x-hidden">
            <Toaster /* ... */ />
            <Header />
            <div className="flex flex-1 container mx-auto">
                <Sidebar />
                <main className="flex-grow p-4">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default App;