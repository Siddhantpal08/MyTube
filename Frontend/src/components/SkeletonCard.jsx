import React from 'react';

function SkeletonCard() {
    return (
        <div className="w-72 flex-shrink-0 animate-pulse">
            <div className="w-full aspect-video bg-gray-700 rounded-xl"></div>
            <div className="mt-2 flex items-start space-x-3">
                <div className="w-9 h-9 rounded-full bg-gray-700 flex-shrink-0 mt-1"></div>
                <div className="flex-1 space-y-2 py-1">
                    <div className="h-5 bg-gray-700 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                </div>
            </div>
        </div>
    );
}

export default SkeletonCard;
