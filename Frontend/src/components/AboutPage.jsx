import React from 'react';
import { Link } from 'react-router-dom';
import myTubeLogo from '/mytube-logo.png';

function AboutPage() {
    return (
        <div className="max-w-4xl mx-auto p-4 text-white">
            <div className="text-center mb-12">
                <img src={myTubeLogo} alt="MyTube Logo" className="w-24 h-24 mx-auto mb-4" />
                <h1 className="text-5xl font-extrabold">About MyTube</h1>
                <p className="text-gray-400 mt-2">A Full-Stack Video Sharing Platform</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg space-y-4">
                <h2 className="text-2xl font-bold">Project Overview</h2>
                <p className="text-gray-300">MyTube is a comprehensive project built to demonstrate a full-stack development process, incorporating a robust backend API with a dynamic, responsive frontend inspired by YouTube.</p>
                <h3 className="text-xl font-semibold pt-4">Technology Stack:</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                    <li>**Frontend:** React (Vite), Tailwind CSS, Axios, React Router</li>
                    <li>**Backend:** Node.js, Express.js</li>
                    <li>**Database:** MongoDB (with Mongoose)</li>
                    <li>**Deployment:** Vercel (Frontend) & Railway (Backend)</li>
                </ul>
            </div>
        </div>
    );
}

export default AboutPage;