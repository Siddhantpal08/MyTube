// src/components/Footer.jsx
import React from 'react';

function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-800 text-gray-400 py-6 mt-12">
            <div className="container mx-auto text-center">
                <p>&copy; {currentYear} MyTube. @All Rights Reserved.</p>
                <p className="text-sm mt-2">A portfolio project by @Siddhant Pal</p>
            </div>
        </footer>
    );
}

export default Footer;