import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import router from './Router.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* The Router is the outermost provider. Do NOT wrap this in AuthProvider. */}
    <RouterProvider router={router} />
  </React.StrictMode>
);