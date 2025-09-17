// src/components/VideoCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const placeholderAvatar = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2EwYWVjMCI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMTguNzUgMTkuMTI1YTUuMjUgNS4yNSAwIDAgMC0xMC41IDBWMTguNzVjMC0uNDEzLS4wMy0uODI2LS4wODItMS4yMzFsLS43NTQtLjM3N2EuNzUuNzUgMCAwIDAtLjQ5OC44MDVsLjc4NyA0LjcyM2MwIC4zOTYuMzQuNzI2LjczNi43MjZoMTMuMjc0Yy4zOTUgMCAuNzM1LS4zMy43MzYtLjcyNmwzLjE0Ni0xOC44NzhhLjc1Ljc1IDAgMSAwLTEuNDc4LS4yNDhsLTIuMjkyIDEzLjc1MmEuMjUuMjUgMCAwIDEtLjQ4My4wODJsLS44MDgtMi4zMjNjLS4zNi0xLjAzNi0uOTcxLTEuOTg2LTEuNzUtMi44MTRhMy43NSA0LjEyNyAwIDAgMC0zLTEuMjg3aC0xLjVhMy43NSA0LjEyNyAwIDAgMC0zIDEuMjg3Yy0uNzc5LjgyOC0xLjM5IDIuNzU5LTEuNzUgMi44MTRsLS44MDggMi4zMjNhLjI1Ljg0MSAwIDAgMS0uNDgzLS4wODJsLS4zMy0uOTQyYS43NS43NSAwIDAgMC0xLjM5Ni40ODdsLjM1MyAxLjAwNWE1LjI1IDUuMjUgMCAwIDAgMTAuMDI4IDBMMTguNzUgMTkuMTI1WiIgY2xpcC1ydWxlPSJldmVub2RkIiAvPjwvc3ZnPg==`;
const timeSince = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return ''; // Invalid date check

    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "just now";
};

function VideoCard({ video }) {
    const videoLink = `/watch/${video._id || video.videoId}`;
    const channelName = video.owner?.username || video.channelTitle;

    return (
        <Link to={videoLink} className="w-full">
            <div className="w-full">
                {/* FIXED: Replaced old classes with the new, built-in aspect-video class */}
                <div className="relative mb-2 w-full aspect-video">
                    <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover rounded-lg bg-gray-700"
                    />
                    {video.duration && (
                        <span className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                           {Math.floor(video.duration / 60)}:{String(Math.floor(video.duration % 60)).padStart(2, '0')}
                        </span>
                    )}
                </div>
                <div className="flex items-start">
                    <img src={video.owner?.avatar || placeholderAvatar} alt={channelName} className="w-9 h-9 rounded-full mr-3 bg-gray-600" />
                    <div className="flex flex-col">
                        <h3 className="font-bold text-md text-white line-clamp-2">{video.title}</h3>
                        <p className="text-sm text-gray-400">{channelName}</p>
                        <p className="text-sm text-gray-400">
                            {parseInt(video.views || 0).toLocaleString()} views • {timeSince(video.createdAt || video.publishedAt)}
                        </p>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default VideoCard;