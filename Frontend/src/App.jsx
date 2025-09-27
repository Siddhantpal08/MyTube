import React from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./Context/AuthContext";
import App from "./App";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import Dashboard from "./components/Dashboard";
// import your other pages

function AppRouter() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/" element={<App />}>
          <Route index element={<Dashboard />} />
          {/* your other protected routes */}
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default AppRouter;