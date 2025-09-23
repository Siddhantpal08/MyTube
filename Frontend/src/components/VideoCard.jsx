import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatCompactNumber, placeholderAvatar, timeSince } from '../utils/formatters';

function VideoCard({ video }) {
    const navigate = useNavigate();
    const videoLink = `/watch/${video._id || video.videoId}`;
    const channelName = video.owner?.username || video.channelTitle;
    
    // Create a separate link for the channel page
    const channelLink = `/channel/${video.owner?.username}`;

    // Handler to navigate to channel page without triggering video page navigation
    const handleChannelClick = (e) => {
        e.preventDefault(); // Stop the click from propagating to the main Link
        navigate(channelLink);
    };

    return (
        <Link to={videoLink} className="w-full">
            <div className="w-full">
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
                    {/* The avatar is now a clickable link */}
                    <Link to={channelLink} onClick={handleChannelClick}>
                        <img src={video.owner?.avatar || placeholderAvatar} alt={channelName} className="w-9 h-9 rounded-full mr-3 bg-gray-600" />
                    </Link>
                    <div className="flex flex-col">
                        <h3 className="font-bold text-md text-white line-clamp-2">{video.title}</h3>
                        {/* The channel name is now a clickable link */}
                        <Link to={channelLink} onClick={handleChannelClick}>
                            <p className="text-sm text-gray-400 hover:text-white transition-colors">{channelName}</p>
                        </Link>
                        <p className="text-sm text-gray-400">
                            {formatCompactNumber(video.views || 0)} views • {timeSince(video.createdAt || video.publishedAt)}
                        </p>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default VideoCard;