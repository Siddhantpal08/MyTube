import express from 'express';
import cors from "cors";
import cookieParser from 'cookie-parser';
import connectDB from './db/index.js'; // Import your DB connection function

// --- CONNECT TO DATABASE ---
// This will establish the database connection when the serverless function starts.
connectDB();
// -------------------------

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN, // Make sure this is set to your Vercel frontend URL in the dashboard
    credentials: true
}))

// Middleware setup remains the same
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// --- Routes Import ---
import userRouter from './routes/user.routes.js'
import healthcheckRouter from "./routes/healthcheck.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import videoRouter from "./routes/video.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"
import youtubeRouter from './routes/youtube.routes.js';

// --- Routes Declaration ---
app.get("/", (req, res) => {
    res.status(200).send("<h1>MyTube Backend is Live on Vercel!</h1>");
});

app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/dashboard", dashboardRouter)
app.use("/api/v1/youtube", youtubeRouter);

// Export the configured app
export { app }