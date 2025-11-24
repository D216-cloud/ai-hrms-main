import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

// Configure Cloudinary with validation
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Validate required configuration
if (!cloudName || !apiKey || !apiSecret) {
  console.warn("Cloudinary configuration is incomplete. Please check your environment variables.");
  console.warn("Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET");
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

/**
 * Upload file to Cloudinary
 * @param {Buffer} fileBuffer - File buffer to upload
 * @param {string} fileName - Original file name
 * @param {string} folder - Cloudinary folder (default: "resumes")
 * @returns {Promise<{url: string, publicId: string}>}
 */
export async function uploadToCloudinary(
  fileBuffer,
  fileName,
  folder = "resumes"
) {
  // Check if Cloudinary is properly configured
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not properly configured. Please contact support.");
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        public_id: `${Date.now()}_${fileName.replace(/\s/g, "_")}`,
        use_filename: true,
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          reject(new Error(`Failed to upload resume. Please try again or contact support. Error: ${error.message}`));
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      }
    );

    // Convert buffer to stream and pipe to Cloudinary
    const stream = Readable.from(fileBuffer);
    stream.pipe(uploadStream);
  });
}

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<void>}
 */
export async function deleteFromCloudinary(publicId) {
  try {
    // Check if Cloudinary is properly configured
    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error("Cloudinary is not properly configured.");
    }
    
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    throw error;
  }
}

export default cloudinary;