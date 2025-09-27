import React from "react";
import { Outlet } from "react-router-dom";

function App() {
  return (
    <div className="app">
      {/* Common layout (Navbar, Sidebar, etc.) */}
      <Outlet />
    </div>
  );
}

export default App;
