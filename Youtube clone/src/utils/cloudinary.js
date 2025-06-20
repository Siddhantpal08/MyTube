import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

const uploadOnCloudinary = async (localfilepath) => {
    try {
        if (!localfilepath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localfilepath, {
            resource_type: "auto",
        })
        //File has been uploaded successfully
        console.log("file is uploaded on cloudinary",
        response.url);
        return response;
        
    } catch (error) {
        fs.unlinkSync(localfilepath) /* remove the file if upload fails
        locally saved temporary file as the upload operation got failed */
        return null;
    }
}

export { uploadOnCloudinary } ;