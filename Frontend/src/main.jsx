// src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './Context/AuthContext.jsx';
import { AppProvider } from './Context/AppContext.jsx';   // 👈 Import is correct
import { ThemeProvider } from './Context/ThemeContext.jsx';
import router from './Router.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AppProvider> {/* 👈 AppProvider is now correctly wrapping the app */}
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </AppProvider>
    </ThemeProvider>
  </React.StrictMode>
);