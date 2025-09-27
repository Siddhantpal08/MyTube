import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
    const [youtubeQuotaExhausted, setYoutubeQuotaExhausted] = useState(false);

    const value = {
        youtubeQuotaExhausted,
        setYoutubeQuotaExhausted,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};