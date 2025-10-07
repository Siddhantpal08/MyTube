import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// This configuration ensures all communication and generated URLs are secure.
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true // This is the crucial line for all new uploads
});

/**
 * Uploads a file to Cloudinary from a local path.
 * @param {string} localFilePath - The local path to the file to upload.
 * @returns {object | null} The Cloudinary response object or null if the upload fails.
 */
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        
        // Upload the file to Cloudinary, letting it automatically detect the resource type.
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        // File has been uploaded successfully, now remove the local temporary copy.
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return response;

    } catch (error) {
        // If an error occurs during upload, make sure to safely remove the local file.
        // This 'existsSync' check prevents a server crash if the file was already removed.
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        console.error("Cloudinary upload failed:", error);
        return null;
    }
};

/**
 * Deletes a file from Cloudinary using its full URL.
 * @param {string} url - The full URL of the resource to delete.
 * @param {string} resource_type - The type of resource ('image', 'video'). Defaults to "image".
 * @returns {object | null} The Cloudinary response object or null if deletion fails.
 */
const deleteFromCloudinary = async (url, resource_type = "image") => {
    try {
        if (!url) return null;

        // This is a more robust way to extract the public_id from a Cloudinary URL.
        // It correctly handles folders in the path.
        // Example: "https://.../v12345/folder/sample.jpg" -> "folder/sample"
        const publicIdWithFolder = url.split('/').slice(-2).join('/').split('.')[0];
        
        if (!publicIdWithFolder) {
            console.error("Could not extract public_id from URL:", url);
            return null;
        }

        const result = await cloudinary.uploader.destroy(publicIdWithFolder, {
            resource_type: resource_type,
        });

        console.log("Successfully deleted from Cloudinary:", result);
        return result;
    } catch (error) {
        console.error("Error deleting from Cloudinary:", error);
        return null;
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };