# Cloudinary Integration Guide

## Setup Instructions

### 1. Create Cloudinary Account
1. Go to [Cloudinary](https://cloudinary.com/) and sign up for a free account
2. After logging in, go to the Dashboard
3. Note down your **Cloud Name** from the dashboard

### 2. Create Upload Preset
1. In Cloudinary dashboard, go to **Settings** → **Upload**
2. Scroll down to **Upload presets**
3. Click **Add upload preset**
4. Configure the preset:
   - **Preset name**: Choose a name (e.g., `warranty_caselines`)
   - **Signing Mode**: Select **Unsigned** (for frontend uploads)
   - **Folder**: Set to `warranty-caselines` (optional, for organization)
   - **Access mode**: Public
5. Save the preset

### 3. Configure Environment Variables
1. Copy `.env.example` to `.env` in the FE folder:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Cloudinary credentials:
   ```env
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
   VITE_CLOUDINARY_UPLOAD_PRESET=your_preset_name_here
   VITE_CLOUDINARY_API_KEY=your_api_key_here  # Optional
   ```

### 4. Usage in Application

The Cloudinary service is automatically integrated into the case line creation flow:

1. When creating a new case line, you can upload 1 or more images
2. Images are automatically uploaded to Cloudinary before case line creation
3. Cloudinary URLs are sent to the backend in the `evidenceImageUrls` array
4. Images can be viewed in the case line details modal

### 5. Backend Integration

The backend should expect the following field in case line creation:

```json
{
  "diagnosisText": "...",
  "correctionText": "...",
  "typeComponentId": "...",
  "quantity": 1,
  "warrantyStatus": "ELIGIBLE",
  "evidenceImageUrls": [
    "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/warranty-caselines/abc123.jpg",
    "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/warranty-caselines/def456.jpg"
  ]
}
```

### 6. File Restrictions

- **Max file size**: 10MB per image
- **Allowed formats**: All image formats (jpg, png, gif, webp, etc.)
- **Upload location**: Images are stored in `warranty-caselines/` folder

### 7. Troubleshooting

#### Upload fails with "Invalid upload preset"
- Ensure the upload preset is set to **Unsigned**
- Double-check the preset name in your `.env` file

#### Images don't display
- Check browser console for CORS errors
- Ensure your Cloudinary account allows public access to uploaded images

#### Environment variables not working
- Make sure you restart your dev server after changing `.env`
- Verify the variable names start with `VITE_`

### 8. Security Notes

- Upload presets should be **unsigned** for frontend uploads
- Consider implementing backend proxy for uploads in production
- Never commit `.env` file to version control
- Use separate presets for development and production

### 9. API Reference

```typescript
// Upload single image
import { uploadImageToCloudinary } from '@/services/cloudinaryService';

const url = await uploadImageToCloudinary(file, (progress) => {
  console.log(`Upload progress: ${progress.percentage}%`);
});

// Upload multiple images
import { uploadImagesToCloudinary } from '@/services/cloudinaryService';

const urls = await uploadImagesToCloudinary(files, (fileIndex, progress) => {
  console.log(`File ${fileIndex + 1}: ${progress.percentage}%`);
});
```

### 10. Cost Considerations

Cloudinary free tier includes:
- 25 GB storage
- 25 GB bandwidth per month
- 25,000 transformations per month

Monitor your usage in the Cloudinary dashboard.
