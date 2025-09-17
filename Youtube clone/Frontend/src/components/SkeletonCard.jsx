// src/components/SkeletonCard.jsx
import React from 'react';

const SkeletonCard = () => (
    <div className="w-full">
        <div className="w-full aspect-video bg-gray-700 rounded-lg animate-pulse"></div>
        <div className="flex items-start mt-2">
            <div className="w-9 h-9 rounded-full mr-3 bg-gray-700 animate-pulse flex-shrink-0"></div>
            <div className="flex flex-col w-full">
                <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2 animate-pulse"></div>
            </div>
        </div>
    </div>
);

export default SkeletonCard;