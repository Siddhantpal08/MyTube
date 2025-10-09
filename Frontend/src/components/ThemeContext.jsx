// src/Context/ThemeContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the context
const ThemeContext = createContext();

// Create the provider component
export const ThemeProvider = ({ children }) => {
    // State to hold the current theme. We get the initial value from localStorage.
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

    // Effect to apply the theme class to the <html> element
    useEffect(() => {
        const root = window.document.documentElement;

        if (theme === 'light') {
            root.classList.remove('dark');
        } else {
            root.classList.add('dark');
        }

        // Save the user's preference in localStorage
        localStorage.setItem('theme', theme);
    }, [theme]);

    const value = { theme, setTheme };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

// Create a custom hook to easily use the context
export const useTheme = () => {
    return useContext(ThemeContext);
};