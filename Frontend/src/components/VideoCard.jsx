import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

// A helper function for formatting view counts (e.g., 1.2M)
// You can place this in a utils/formatters.js file later
const formatCompactNumber = (number) => {
    if (!number) return '0';
    if (number < 1000) return number.toString();
    if (number < 1000000) return (number / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    if (number < 1000000000) return (number / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    return (number / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
};

function VideoCard({ video }) {
    // Determine the correct link for the video (YouTube API vs. your DB)
    const videoLink = `/watch/${video._id || video.videoId}`;
    const channelName = video.owner?.username || video.channelTitle;
    const navigate = useNavigate();

    // This stops the click from navigating to the video watch page when clicking the channel name
    const handleChannelClick = (e) => {
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
                </div>
            </Link>
            <div className="mt-2 flex items-start space-x-3">
                {/* Channel Avatar Placeholder */}
                <Link to={video.owner?.username ? `/channel/${video.owner.username}` : '#'} onClick={handleChannelClick}>
                    <div className="w-9 h-9 rounded-full bg-gray-600 flex-shrink-0 mt-1">
                        {/* You can add an <img /> tag here later for the channel avatar */}
                    </div>
                </Link>
                
                <div>
                    <Link to={videoLink}>
                        <h3 className="text-white font-semibold text-md overflow-hidden text-ellipsis h-12" title={video.title}>
                            {/* Truncate long titles */}
                            {video.title.length > 50 ? `${video.title.substring(0, 50)}...` : video.title}
                        </h3>
                    </Link>
                    <Link to={video.owner?.username ? `/channel/${video.owner.username}` : '#'} onClick={handleChannelClick}>
                        <p className="text-sm text-gray-400 mt-1 hover:text-white transition-colors">{channelName}</p>
                    </Link>
                    <p className="text-sm text-gray-400">
                        {formatCompactNumber(video.views || 0)} views
                    </p>
                </div>
            </div>
        </div>
    );
}

export default VideoCard;