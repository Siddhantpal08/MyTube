import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatCompactNumber, placeholderAvatar, timeSince } from '../utils/formatters';

function VideoCard({ video }) {
    const navigate = useNavigate();
    const videoLink = `/watch/${video._id || video.videoId}`;
    const channelName = video.owner?.username || video.channelTitle;

    const handleChannelClick = (e) => {
        // This stops the click from navigating to the video watch page
        e.preventDefault(); 
        if (video.owner?.username) {
            navigate(`/channel/${video.owner.username}`);
        }
    };

    return (
        <div className="w-full">
            <Link to={videoLink}>
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
            </Link>
            <div className="flex items-start">
                {/* If it's an internal video with an owner, make the avatar a clickable link */}
                {video.owner?._id ? (
                    <Link to={`/channel/${video.owner.username}`} onClick={handleChannelClick}>
                        <img src={video.owner.avatar || placeholderAvatar} alt={channelName} className="w-9 h-9 rounded-full mr-3 bg-gray-600" />
                    </Link>
                ) : (
                    <img src={video.owner?.avatar || placeholderAvatar} alt={channelName} className="w-9 h-9 rounded-full mr-3 bg-gray-600" />
                )}
                
                <div className="flex flex-col">
                    <Link to={videoLink}>
                        <h3 className="font-bold text-md text-white line-clamp-2">{video.title}</h3>
                    </Link>

                    {/* If it's an internal video, make the channel name a link */}
                    {video.owner?._id ? (
                        <Link to={`/channel/${video.owner.username}`} onClick={handleChannelClick}>
                            <p className="text-sm text-gray-400 hover:text-white transition-colors">{channelName}</p>
                        </Link>
                    ) : (
                        <p className="text-sm text-gray-400">{channelName}</p>
                    )}
                    
                    <p className="text-sm text-gray-400">
                        {formatCompactNumber(video.views || 0)} views • {timeSince(video.createdAt || video.publishedAt)}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default VideoCard;