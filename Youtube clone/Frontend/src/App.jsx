// src/App.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTopButton from './components/ScrollToTopButton'; 

function App() {
    const { loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
                <h1 className="text-2xl">Loading Application...</h1>
            </div>
        );
    }

    // This is the SINGLE place where Header and Footer should exist.
    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            <Toaster position="top-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
            
            <Header />

            <main className="container mx-auto p-4 flex-grow">
                <Outlet /> {/* Your pages (HomePage, WatchPage, etc.) render here */}
            </main>

            <Footer />
            <ScrollToTopButton />
        </div>
    );
}

export default App;