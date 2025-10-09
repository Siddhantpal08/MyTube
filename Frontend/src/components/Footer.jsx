import React from 'react';

function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="py-6 mt-12 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors duration-200">
            <div className="container mx-auto text-center">
                <p>&copy; {currentYear} MyTube. All Rights Reserved.</p>
                <p className="text-sm mt-2">A project by Siddhant Pal</p>
            </div>
        </footer>
    );
}

export default Footer;