// src/utils/formatters.js

// Function to format large numbers into K/M/B
export const formatCompactNumber = (number) => {
    if (number === undefined || number === null) return '0';
    return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        compactDisplay: 'short'
    }).format(number);
};

// Complete and correct SVG for placeholder avatar
export const placeholderAvatar = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2EwYWVjMCI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMTguNzUgMTkuMTI1YTUuMjUgNS4yNSAwIDAgMC0xMC41IDBWMTguNzVjMC0uNDEzLS4wMy0uODI2LS4wODItMS4yMzFsLS43NTQtLjM3N2EuNzUuNzUgMCAwIDAtLjQ5OC44MDVsLjc4NyA0LjcyM2MwIC4zOTYuMzQuNzI2LjczNi43MjZoMTMuMjc0Yy4zOTUgMCAuNzM1LS4zMy43MzYtLjcyNmwzLjE0Ni0xOC44NzhhLjc1Ljc1IDAgMSAwLTEuNDc4LS4yNDhsLTIuMjkyIDEzLjc1MmEuMjUuMjUgMCAwIDEtLjQ4My4wODJsLS44MDgtMi4zMjNjLS4zNi0xLjAzNi0uOTcxLTEuOTg2LTEuNzUtMi44MTRhMy43NSA0LjEyNyAwIDAgMC0zLTEuMjg3aC0xLjVhMy43NSA0LjEyNyAwIDAgMC0zIDEuMjg3Yy0uNzc5LjgyOC0xLjM5IDIuNzU5LTEuNzUgMi44MTRsLS44MDggMi4zMjNhLjI1Ljg0MSAwIDAgMS0uNDgzLS4wODJsLS4zMy0uOTQyYS43NS43NSAwIDAgMC0xLjM5Ni40ODdsLjM1MyAxLjAwNWE1LjI1IDUuMjUgMCAwIDAgMTAuMDI4IDBMMTguNzUgMTkuMTI1WiIgY2xpcC1ydWxlPSJldmVub2RkIiAvPjwvc3ZnPg==`;

// Helper for time formatting (can be moved here too if not already in another utility)
export const timeSince = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
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