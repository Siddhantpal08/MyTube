import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { timeSince, formatCompactNumber, placeholderAvatar } from '../utils/formatters';

// Helper function to parse YouTube's ISO 8601 duration format (e.g., "PT15M33S")
// into a human-readable format (e.g., "15:33").
const parseDuration = (isoDuration) => {
    if (!isoDuration || typeof isoDuration !== 'string') return null;
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = isoDuration.match(regex);

    if (!matches) return null;

    const hours = matches[1] ? parseInt(matches[1], 10) : 0;
    const minutes = matches[2] ? parseInt(matches[2], 10) : 0;
    const seconds = matches[3] ? parseInt(matches[3], 10) : 0;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

function VideoCard({ video }) {
    const navigate = useNavigate();

    // This handles both internal videos (which have an _id) and YouTube videos (which have a videoId)
    const videoLink = `/watch/${video._id || video.videoId}`;
    const channelName = video.owner?.username || video.channelTitle;
    const formattedDuration = parseDuration(video.duration);

    const handleChannelClick = (e) => {
        // This stops the click from navigating to the video when you click the channel name/avatar
        e.preventDefault(); 
        if (video.owner?.username) {
            navigate(`/channel/${video.owner.username}`);
        }
    };

    return (
        <div className="w-full sm:w-72 flex-shrink-0 group">
            <Link to={videoLink}>
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-800">
                    <img 
                        src={video.thumbnail} 
                        alt={video.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                    />
                    {/* Display the video duration on the bottom-right of the thumbnail */}
                    {formattedDuration && (
                        <span className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                            {formattedDuration}
                        </span>
                    )}
                </div>
            </Link>
            <div className="mt-2 flex items-start space-x-3">
                <Link to={video.owner?.username ? `/channel/${video.owner.username}` : '#'} onClick={handleChannelClick}>
                    <img src={video.owner?.avatar || placeholderAvatar} alt={channelName} className="w-9 h-9 rounded-full bg-gray-600 flex-shrink-0 mt-1" />
                </Link>
                <div>
                    <Link to={videoLink}>
                        <h3 className="text-white font-semibold text-md overflow-hidden text-ellipsis h-12" title={video.title}>
                            {video.title.length > 50 ? `${video.title.substring(0, 50)}...` : video.title}
                        </h3>
                    </Link>
                    <Link to={video.owner?.username ? `/channel/${video.owner.username}` : '#'} onClick={handleChannelClick}>
                        <p className="text-sm text-gray-400 mt-1 hover:text-white transition-colors">{channelName}</p>
                    </Link>
                    <p className="text-sm text-gray-400">
                        {/* Correctly displays views and upload time for all video types */}
                        {formatCompactNumber(video.views || 0)} views • {timeSince(video.createdAt || video.publishTime)}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default VideoCard;