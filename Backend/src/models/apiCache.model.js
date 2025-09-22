// src/models/apiCache.model.js
import mongoose, { Schema } from "mongoose";

const apiCacheSchema = new Schema({
    query: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    response: {
        type: Object, // We'll store the entire simplified response object
        required: true,
    },
    // This will help us automatically delete old cache entries
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600, // The cache will expire after 1 hour (3600 seconds)
    },
});

export const ApiCache = mongoose.model("ApiCache", apiCacheSchema);