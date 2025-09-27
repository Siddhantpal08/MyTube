import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// This configuration ensures all communication and generated URLs are secure.
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true // This forces all generated URLs to use HTTPS, fixing mixed content warnings.
});

/**
 * Uploads a file to Cloudinary
 * @param {string} localFilePath - The local path to the file to upload.
 * @returns {object | null} The Cloudinary response object or null if upload fails.
 */
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        
        // Upload the file to Cloudinary with automatic resource type detection
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        // File has been uploaded successfully, now remove the local copy.
        fs.unlinkSync(localFilePath);
        return response;

    } catch (error) {
        // If an error occurs, make sure to safely remove the locally saved temporary file.
        // This 'existsSync' check prevents a server crash if the file doesn't exist.
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
 * @param {string} resource_type - The type of resource ('image', 'video', etc.).
 * @returns {object | null} The Cloudinary response object or null if deletion fails.
 */
const deleteFromCloudinary = async (url, resource_type = "image") => {
    try {
        if (!url) return null;

        // This is a more robust way to extract the public_id from a Cloudinary URL.
        // It correctly handles folders in the path.
        // Example: "https://.../v12345/folder/sample.jpg" -> "folder/sample"
        const publicId = url.split('/').slice(-2).join('/').split('.')[0];
        
        if (!publicId) {
            console.error("Could not extract public_id from URL:", url);
            return null;
        }

        const result = await cloudinary.uploader.destroy(publicId, {
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