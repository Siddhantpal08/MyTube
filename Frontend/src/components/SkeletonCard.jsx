import React from 'react';

function SkeletonCard() {
    return (
        <div className="w-full">
            {/* Video Thumbnail Skeleton */}
            <div className="w-full aspect-video rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            
            <div className="mt-2 flex items-start space-x-3">
                {/* Avatar Skeleton */}
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse flex-shrink-0"></div>
                
                {/* Text Lines Skeleton */}
                <div className="w-full space-y-2 pt-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
                </div>
            </div>
        </div>
    );
}

export default SkeletonCard;