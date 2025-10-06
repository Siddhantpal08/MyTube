import express from 'express';
import cors from "cors";
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public")); // Only need this once
app.use(cookieParser());

// --- ROUTES IMPORT ---
import userRouter from './routes/user.routes.js';
import healthcheckRouter from "./routes/healthcheck.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import youtubeRouter from './routes/youtube.routes.js';

// --- ROUTES DECLARATION (THE FIX IS HERE) ---
// This is the critical section that was missing.
// It tells your app to use your routers for the specified URL paths.
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/users", userRouter); // This makes /api/v1/users/register work
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/youtube", youtubeRouter);

// --- Root Route: API Landing Page ---
app.get("/", (req, res) => {
    const apiStatusHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="icon" type="image/png" href="/mytube-logo.png">
        <title>MyTube API Status</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
            body {
                font-family: 'Inter', sans-serif;
                background-color: #0F0F0F;
                color: #FFFFFF;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                text-align: center;
            }
            .container {
                padding: 40px;
                border-radius: 16px;
                background-color: #1A1A1A;
                border: 1px solid #2D2D2D;
                max-width: 600px;
                width: 90%;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            }
            .logo {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 15px;
                margin-bottom: 25px;
            }
            .logo svg {
                width: 50px;
                height: 50px;
            }
            .logo h1 {
                font-size: 2.5rem;
                font-weight: 700;
                margin: 0;
                color: #FF0000;
            }
            .status-badge {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background-color: #1F3D2A;
                color: #2ECC71;
                padding: 8px 16px;
                border-radius: 50px;
                font-weight: 500;
                margin-bottom: 20px;
                border: 1px solid #2ECC71;
            }
            .status-badge .dot {
                width: 10px;
                height: 10px;
                background-color: #2ECC71;
                border-radius: 50%;
                animation: pulse 1.5s infinite;
            }
            p {
                font-size: 1.1rem;
                color: #AAAAAA;
                line-height: 1.6;
            }
            .api-endpoints {
                margin-top: 30px;
                text-align: left;
            }
            .api-endpoints h3 {
                color: #FFFFFF;
                font-weight: 500;
                margin-bottom: 15px;
                border-bottom: 1px solid #333;
                padding-bottom: 10px;
            }
            .api-endpoints ul {
                list-style: none;
                padding: 0;
            }
            .api-endpoints li {
                background-color: #252525;
                padding: 12px;
                border-radius: 8px;
                margin-bottom: 10px;
                font-family: 'Courier New', Courier, monospace;
                color: #DDDDDD;
            }
            @keyframes pulse {
                0% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.7); }
                70% { box-shadow: 0 0 0 10px rgba(46, 204, 113, 0); }
                100% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0); }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" fill="#FF0000"/>
                </svg>
                <h1>MyTube</h1>
            </div>
            <div class="status-badge">
                <div class="dot"></div>
                <span>API Operational</span>
            </div>
            <p>The MyTube backend is live and running successfully on Railway. This server handles all data operations for the MyTube application.</p>
            <div class="api-endpoints">
                <h3>Key Endpoints:</h3>
                <ul>
                    <li>GET /api/v1/healthcheck</li>
                    <li>GET /api/v1/users/...</li>
                    <li>GET /api/v1/videos/...</li>
                    <li>GET /api/v1/youtube/search</li>
                </ul>
            </div>
        </div>
    </body>
    </html>
    `;
    res.status(200).send(apiStatusHtml);
});

// Export the configured app
export { app }