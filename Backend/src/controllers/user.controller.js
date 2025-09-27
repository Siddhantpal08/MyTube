// src/controllers/user.controller.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken';
import mongoose from "mongoose";
import crypto from 'crypto'; // Node.js built-in module for crypto operations
import sendEmail from "../utils/mailer.js"; // You'll need to create this utility

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access tokens");
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, username, email, password } = req.body;

    if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }
    
    // Cover image is optional
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;
    if (!username && !email) {
        throw new ApiError(400, "Username or email is required");
    }

    const user = await User.findOne({ $or: [{ username }, { email }] });
    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true, // Set to true in production
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged In Successfully"));
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        { $unset: { refreshToken: 1 } },
        { new: true }
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

        const options = {
            httpOnly: true,
            secure: true,
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access token refreshed"));
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400,"Invalid old password")
    }

    user.password = newPassword // Mongoose pre-save hook will hash it
    await user.save({validateBeforeSave: false}) // Changed to false to avoid validation on all fields

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req, res ) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "User data fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName , email} = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "Please provide all fields")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName, email
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))

})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Please provide an avatar")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar?.url) { // Check for avatar.url
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar Image Updated Successfully")
    )
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Please provide an Cover Image")
    }

    // FIX: use coverImageLocalPath here, not avatarLocalPath
    const coverImage = await uploadOnCloudinary(coverImageLocalPath) 

    if (!coverImage?.url) { // Check for coverImage.url
        throw new ApiError(400, "Error while uploading Cover Image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover Image Updated Successfully")
    )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const {username} = req.params

    if (!username?.trim()) {
        throw new ApiError(400,"username is missing")
    }

    // Aggregate to fetch channel data, subscribers count
    const channelAggregate = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from: "subscriptions", // Correct collection name (plural)
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup:{
                from: "subscriptions", // Correct collection name (plural)
                localField: "_id",
                foreignField: "subscriber",
                as : "subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: req.user?._id ? { // FIX: Check if user is logged in
                            $in: [ req.user._id, "$subscribers.subscriber"]
                        } : false, // If not logged in, always false
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
                createdAt: 1 // good to include
            }
        }
    ])

    if (!channelAggregate?.length) { // Check length
        throw new ApiError(404, "Channel does not exists");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channelAggregate[0], "User Channel fetched Succesfully")
    )
})

const getWatchHistory = asyncHandler(async (req, res) => {
    // Ensure req.user._id exists before querying
    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized: Please log in to view watch history");
    }

    const userWithHistory = await User.findById(req.user._id).populate({
        path: 'watchHistory',
        populate: {
            path: 'owner',
            select: 'username avatar'
        }
    });

    if (!userWithHistory) {
        throw new ApiError(404, "User not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, userWithHistory.watchHistory, "Watch history fetched successfully"));
});

const searchChannels = asyncHandler(async (req, res) => {
    const { query } = req.query;

    if (!query || query.trim() === "") {
        throw new ApiError(400, "Search query is required");
    }

    const users = await User.find({
        username: { $regex: query, $options: "i" } // Case-insensitive search
    }).select("username fullName avatar"); // Only return necessary fields

    return res.status(200).json(new ApiResponse(200, users, "Channels fetched successfully"));
});


// FORGOT PASSWORD AND RESET PASSWORD LOGIC
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({ email });

    if (!user) {
        // For security, always send a generic message even if email not found
        // to prevent email enumeration attacks.
        return res.status(200).json(new ApiResponse(200, {}, "If an account with that email exists, a password reset link has been sent."));
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken(); // This method needs to be in your User model
    await user.save({ validateBeforeSave: false }); // Save the token and expiry to the user

    // Create reset URL
    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`; // Your frontend reset page
    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetURL} \n\n If you did not request this, please ignore this email and your password will remain unchanged.`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'MyTube Password Reset Token',
            message
        });

        return res.status(200).json(new ApiResponse(200, {}, "Password reset link sent to your email!"));
    } catch (error) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        throw new ApiError(500, "There was an error sending the email. Try again later!");
    }
});


const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
        throw new ApiError(400, "New password is required");
    }
    if (password.length < 8) { // Example: minimum password length
        throw new ApiError(400, "Password must be at least 8 characters long");
    }

    // Hash the incoming token and find the user
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() } // Token must not be expired
    });

    if (!user) {
        throw new ApiError(400, "Password reset token is invalid or has expired.");
    }

    // Set new password
    user.password = password; // Mongoose pre-save hook will hash this
    user.passwordResetToken = undefined; // Clear token
    user.passwordResetExpires = undefined; // Clear expiry
    await user.save(); // This will trigger the pre-save hook to hash the new password

    // Log the user in directly (optional) or just send success
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    return res.status(200).json(
        new ApiResponse(200, { user, accessToken, refreshToken }, "Password reset successful. You are now logged in!")
    );
});


export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
    searchChannels,
    forgotPassword, // Export new controller
    resetPassword,  // Export new controller
};