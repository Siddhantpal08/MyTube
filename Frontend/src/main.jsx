// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './Context/AuthContext.jsx';
import { AppProvider } from './Context/AppContext.jsx';
import { ThemeProvider } from './Context/ThemeContext.jsx';
import router from './Router.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider> 
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);