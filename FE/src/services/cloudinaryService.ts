import axios from 'axios';

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';
const CLOUDINARY_API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY || '';

// Validate Cloudinary configuration
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
  console.warn('Cloudinary configuration missing. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your environment.');
}

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  created_at: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Upload a single image to Cloudinary
 * @param file - The file to upload
 * @param onProgress - Optional callback for upload progress
 * @returns Promise with the secure URL of the uploaded image
 */
export const uploadImageToCloudinary = async (
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  try {
    if (!file) {
      throw new Error('No file provided for upload');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit');
    }

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    
    if (CLOUDINARY_API_KEY) {
      formData.append('api_key', CLOUDINARY_API_KEY);
    }

    // Add folder for organization (optional)
    formData.append('folder', 'warranty-caselines');

    // Upload to Cloudinary
    const response = await axios.post<CloudinaryUploadResponse>(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress({
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage,
            });
          }
        },
      }
    );

    console.log('Image uploaded to Cloudinary:', response.data.secure_url);
    return response.data.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.error?.message || error.message;
      throw new Error(`Cloudinary upload failed: ${message}`);
    }
    throw error;
  }
};

/**
 * Upload multiple images to Cloudinary sequentially
 * @param files - Array of files to upload
 * @param onProgress - Optional callback for each file's progress
 * @returns Promise with array of secure URLs
 */
export const uploadImagesToCloudinary = async (
  files: File[],
  onProgress?: (fileIndex: number, progress: UploadProgress) => void
): Promise<string[]> => {
  try {
    if (!files || files.length === 0) {
      return [];
    }

    console.log(`Uploading ${files.length} images to Cloudinary...`);

    const uploadPromises = files.map((file, index) =>
      uploadImageToCloudinary(file, (progress) => {
        if (onProgress) {
          onProgress(index, progress);
        }
      })
    );

    // Upload all files in parallel
    const urls = await Promise.all(uploadPromises);
    
    console.log(`Successfully uploaded ${urls.length} images to Cloudinary`);
    return urls;
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw error;
  }
};

/**
 * Delete an image from Cloudinary by public ID
 * Note: This requires authentication and is typically done from backend
 * @param publicId - The public ID of the image to delete
 */
export const deleteImageFromCloudinary = async (publicId: string): Promise<boolean> => {
  try {
    console.warn('Direct deletion from frontend is not recommended. Consider using backend API.');
    // This would require signature generation which should be done on backend
    // For now, just log and return false
    return false;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param url - Cloudinary secure URL
 * @returns Public ID or null
 */
export const extractPublicIdFromUrl = (url: string): string | null => {
  try {
    const regex = /\/v\d+\/(.+)\.\w+$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};

export const cloudinaryService = {
  uploadImage: uploadImageToCloudinary,
  uploadImages: uploadImagesToCloudinary,
  deleteImage: deleteImageFromCloudinary,
  extractPublicId: extractPublicIdFromUrl,
};

export default cloudinaryService;
