import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { timeSince, formatCompactNumber, placeholderAvatar } from '../utils/formatters';

// Parses YouTube's specific "PT1M23S" format
const parseISODuration = (isoDuration) => {
    if (typeof isoDuration !== 'string') return null;
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = isoDuration.match(regex);
    if (!matches) return null;

    const hours = parseInt(matches[1] || 0);
    const minutes = parseInt(matches[2] || 0);
    const seconds = parseInt(matches[3] || 0);
    
    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

// Formats a duration given in total seconds
const formatSeconds = (totalSeconds) => {
    if (isNaN(totalSeconds)) return null;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.round(totalSeconds % 60);
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

function VideoCard({ video }) {
    const navigate = useNavigate();
    const videoLink = `/watch/${video._id || video.videoId}`;
    const channelName = video.owner?.username || video.channelTitle;
    const isChannelLinkable = !!video.owner?.username;

    // --- ROBUST URL & DURATION HANDLING ---
    
    let thumbnailUrl = typeof video.thumbnail === 'string' ? video.thumbnail : video.thumbnail?.url;
    if (thumbnailUrl && thumbnailUrl.startsWith('http://')) {
        thumbnailUrl = thumbnailUrl.replace('http://', 'https://');
    }
    
    let avatarUrl = typeof video.owner?.avatar === 'string' ? video.owner.avatar : video.owner?.avatar?.url;
    if (avatarUrl && avatarUrl.startsWith('http://')) {
        avatarUrl = avatarUrl.replace('http://', 'https://');
    }

    // --- THIS IS THE FIX ---
    // This checks the data type of `video.duration` and uses the correct formatter.
    const formattedDuration = typeof video.duration === 'string' 
        ? parseISODuration(video.duration) 
        : formatSeconds(video.duration);

    const handleChannelClick = (e) => {
        if (!isChannelLinkable) {
            e.preventDefault();
            return;
        }
        e.preventDefault(); 
        navigate(`/channel/${video.owner.username}`);
    };

    return (
        <div className="w-full sm:w-72 flex-shrink-0 group">
            <Link to={videoLink}>
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800">
                    <img 
                        src={thumbnailUrl} 
                        alt={video.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                    />
                    {/* The duration is now displayed using the smart `formattedDuration` variable */}
                    {formattedDuration && (
                        <span className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                            {formattedDuration}
                        </span>
                    )}
                </div>
            </Link>
            <div className="mt-2 flex items-start space-x-3">
                <Link to={isChannelLinkable ? `/channel/${video.owner.username}` : '#'} onClick={handleChannelClick} className="flex-shrink-0 mt-1">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-600">
                        <img 
                            src={avatarUrl || placeholderAvatar}
                            alt={channelName}
                            className="w-full h-full object-cover" 
                        />
                    </div>
                </Link>
                <div>
                    <Link to={videoLink}>
                        <h3 className="text-black dark:text-white font-semibold text-md overflow-hidden text-ellipsis h-12" title={video.title}>
                            {video.title.length > 50 ? `${video.title.substring(0, 50)}...` : video.title}
                        </h3>
                    </Link>
                    <Link to={isChannelLinkable ? `/channel/${video.owner.username}` : '#'} onClick={handleChannelClick}>
                        <p className={`text-sm text-gray-600 dark:text-gray-400 mt-1 ${isChannelLinkable ? 'hover:text-black dark:hover:text-white' : 'cursor-default'} transition-colors`}>{channelName}</p>
                    </Link>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatCompactNumber(video.views || 0)} views • {timeSince(video.createdAt || video.publishTime)}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default VideoCard;