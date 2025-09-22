import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

// STRICT: This function throws an error if the user is not logged in.
// Use this for actions like posting, deleting, updating, etc.
export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        console.log("1. verifyJWT middleware started..."); // Log 1

        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        console.log("2. Token decoded successfully."); // Log 2
    
        // The code is likely getting stuck on this next line
        const user = await User.findById(decodedToken?._id).select(" -password -refreshToken");
        console.log("3. Database query for user finished."); // Log 3
    
        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }
    
        req.user = user;
        next();
        console.log("4. verifyJWT middleware finished, passed to next handler."); // Log 4

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token");
    }
});

// FLEXIBLE: This function sets the user if they are logged in but does NOT fail if they are not.
// Use this for pages that are public but have extra features for logged-in users.
export const verifyJWTAndSetUser = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return next(); // If no token, just continue
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
        if (user) {
            req.user = user; // If user exists, add them to the request
        }
        next();
    } catch (error) {
        // If token is invalid, just continue without a user
        next();
    }
});