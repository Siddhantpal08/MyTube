import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async (localfilepath) => {
    try {
        if (!localfilepath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localfilepath, {
            resource_type: "auto",
        })
        //File has been uploaded successfully
        // console.log("file is uploaded on cloudinary",response.url);
        fs.unlinkSync(localfilepath)
        return response;
        
    } catch (error) {
        fs.unlinkSync(localfilepath) /* remove the file if upload fails
        locally saved temporary file as the upload operation got failed */
        return null;
    }
};

const deleteFromCloudinary = async (url, resource_type = "image") => {
    try {
        if (!url) return null;

        // Extract the public_id from the full URL
        // Example URL: http://res.cloudinary.com/demo/image/upload/v12345/folder/sample.jpg
        // The public_id would be: folder/sample
        const publicId = url.split('/').pop().split('.')[0];
        
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resource_type,
        });

        return result;
    } catch (error) {
        console.error("Error deleting from Cloudinary:", error);
        return null;
    }
};

export { uploadOnCloudinary, deleteFromCloudinary } ;