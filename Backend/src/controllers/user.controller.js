import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken';
import mongoose from "mongoose";

// --- Helper Functions ---
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens");
    }
};

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
};

// --- Core Controllers ---
const registerUser = asyncHandler(async (req, res) => {
    const { fullName, username, email, password } = req.body;

    if ([fullName, username, email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({ $or: [{ username: username.toLowerCase() }, { email }] });
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    let avatarUrl;
    if (avatarLocalPath) {
        const avatar = await uploadOnCloudinary(avatarLocalPath);
        avatarUrl = avatar?.url;
    } else {
        avatarUrl = `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(fullName)}`;
    }
    if (!avatarUrl) {
        throw new ApiError(500, "Failed to process avatar");
    }

    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

    const user = await User.create({
        fullName,
        avatar: avatarUrl,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase().trim(),
    });

    // Directly generate tokens and log the user in
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    return res
        .status(201)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(new ApiResponse(201, { user: createdUser, accessToken }, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;
    if (!username && !email) throw new ApiError(400, "Username or email is required");

    const user = await User.findOne({ $or: [{ username: username?.toLowerCase() }, { email }] });
    if (!user) throw new ApiError(404, "User does not exist");

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) throw new ApiError(401, "Invalid user credentials");

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken }, "User logged In Successfully"));
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } }, { new: true });
    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized request");

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id);

        if (!user || incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id);
        return res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", newRefreshToken, cookieOptions)
            .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access token refreshed"));
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "User data fetched successfully"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id);
    if (!user) throw new ApiError(404, "User not found");
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) throw new ApiError(400, "Invalid old password");
    user.password = newPassword;
    await user.save({ validateBeforeSave: true });
    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
});

// --- Channel & Profile Controllers ---

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing");
    }

    // This is a more robust aggregation pipeline to fetch the channel profile.
    const channel = await User.aggregate([
        {
            $match: {
                username: username.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $addFields: {
                subscribersCount: { $size: "$subscribers" },
                // THE FIX: This condition is now safe for guests (when req.user is undefined)
                isSubscribed: {
                    $cond: {
                        if: { $toBool: req.user?._id }, // Check if a user is logged in
                        then: { $in: [req.user._id, "$subscribers.subscriber"] },
                        else: false // If not logged in, they can't be subscribed
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                about: 1
            }
        }
    ]);

    if (!channel?.length) {
        throw new ApiError(404, "Channel does not exist");
    }

    return res.status(200).json(new ApiResponse(200, channel[0], "User channel profile fetched successfully"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(req.user._id) } },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [{ $project: { fullName: 1, username: 1, avatar: 1 } }]
                        }
                    },
                    { $addFields: { owner: { $first: "$owner" } } }
                ]
            }
        },
        { $project: { watchHistory: 1 } }
    ]);

    return res.status(200).json(new ApiResponse(200, user[0].watchHistory.reverse(), "Watch history fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;
    if (!fullName || !email) throw new ApiError(400, "All fields are required");

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { fullName, email } },
        { new: true }
    ).select("-password -refreshToken");

    return res.status(200).json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) throw new ApiError(400, "Avatar file is missing");
    
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar?.url) throw new ApiError(500, "Error while uploading avatar");

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { avatar: avatar.url } },
        { new: true }
    ).select("-password");

    return res.status(200).json(new ApiResponse(200, user, "Avatar image updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) throw new ApiError(400, "Cover image file is missing");

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage?.url) throw new ApiError(500, "Error while uploading cover image");

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { coverImage: coverImage.url } },
        { new: true }
    ).select("-password");

    return res.status(200).json(new ApiResponse(200, user, "Cover image updated successfully"));
});

const searchChannels = asyncHandler(async (req, res) => {
    const { query } = req.query;
    if (!query?.trim()) {
        return res.status(200).json(new ApiResponse(200, [], "Empty query"));
    }
    const users = await User.find({
        username: { $regex: query, $options: "i" }
    }).select("username fullName avatar");
    return res.status(200).json(new ApiResponse(200, users, "Channels fetched successfully"));
});

// --- THESE FUNCTIONS HAVE BEEN RESTORED ---
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) throw new ApiError(400, "Email is required");

    const user = await User.findOne({ email });
    if (!user) {
        // For security, always send a generic success message
        return res.status(200).json(new ApiResponse(200, {}, "If an account exists, a reset link has been sent."));
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const message = `You requested a password reset. Please go to this link to reset your password: \n\n ${resetURL} \n\n If you did not request this, please ignore this email.`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'MyTube Password Reset Token',
            message
        });
        return res.status(200).json(new ApiResponse(200, {}, "Password reset link sent!"));
    } catch (error) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        throw new ApiError(500, "Error sending email. Try again later.");
    }
});

const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
        throw new ApiError(400, "Token is invalid or has expired.");
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res.status(200).json(new ApiResponse(200, {}, "Password reset successful."));
});

const updateUserAbout = asyncHandler(async (req, res) => {
    const { about } = req.body;
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { about: about || '' } },
        { new: true }
    ).select("about");

    if (!user) throw new ApiError(404, "User not found");

    return res.status(200).json(new ApiResponse(200, user, "About section updated successfully"));
});


// --- THE FINAL, COMPLETE EXPORT STATEMENT ---
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
    forgotPassword,
    resetPassword,
    updateUserAbout, 
};