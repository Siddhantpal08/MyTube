import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Layout
import App from "./App.jsx";

// Route protection
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Pages
import HomePage from "./components/HomePage.jsx";
import WatchPage from "./components/Watchpage.jsx";
import SearchResults from "./components/SearchResults.jsx";
import LoginPage from "./components/Login.jsx";
import RegisterPage from "./components/Register.jsx";
import PlaylistPage from "./components/PlaylistPage.jsx";
import PlaylistDetailPage from "./components/PlaylistDetailedPage.jsx";
import CreatorDashboard from "./components/CreatorDashboard.jsx";
import SubscriptionsPage from "./components/SubscriptionsPage.jsx";
import HistoryPage from "./components/HistoryPage.jsx";
import CommunityPage from "./components/CommunityPage.jsx";
import AddTweetPage from "./components/AddTweetPage.jsx";
import MyVideosPage from "./components/MyVideosPage.jsx";
import UploadVideoPage from "./components/UploadVideoPage.jsx";
import ChannelSearchPage from "./components/ChannelSearchPage.jsx";
import ChannelPage from "./components/ChannelPage.jsx";

// --- Error Pages ---
const ErrorBoundary = () => (
  <div className="text-center text-red-500 p-8">
    An unexpected error occurred. Please refresh the page.
  </div>
);

const ErrorPage = () => (
  <div className="flex items-center justify-center min-h-screen">
    <h1 className="text-2xl text-white">
      Something went wrong. Please refresh.
    </h1>
  </div>
);

// --- Router Configuration ---
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "watch/:videoId", element: <WatchPage /> },
      { path: "results", element: <SearchResults /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },

      // Protected Routes
      {
        path: "playlists",
        element: (
          <ProtectedRoute>
            <PlaylistPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "playlist/:playlistId",
        element: (
          <ProtectedRoute>
            <PlaylistDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "creator/dashboard",
        element: (
          <ProtectedRoute>
            <CreatorDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "subscriptions",
        element: (
          <ProtectedRoute>
            <SubscriptionsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "history",
        element: (
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "community",
        element: (
          <ProtectedRoute>
            <CommunityPage />
          </ProtectedRoute>
        ),
      },
      { path: "channel/:userId/community", element: <CommunityPage /> },
      {
        path: "add-tweet",
        element: (
          <ProtectedRoute>
            <AddTweetPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "my-videos",
        element: (
          <ProtectedRoute>
            <MyVideosPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "upload-video",
        element: (
          <ProtectedRoute>
            <UploadVideoPage />
          </ProtectedRoute>
        ),
      },

      // Public Channel Routes
      { path: "search-channels", element: <ChannelSearchPage /> },
      { path: "channel/:username", element: <ChannelPage /> },
    ],
  },
]);

const AppRouter = () => <RouterProvider router={router} />;

export default AppRouter;