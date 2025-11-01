/// <reference types="vite/client" />

interface ImportMetaEnv {
	// Cloudinary configuration
	readonly VITE_CLOUDINARY_CLOUD_NAME?: string;
	readonly VITE_CLOUDINARY_UPLOAD_PRESET?: string;
	readonly VITE_CLOUDINARY_API_KEY?: string;
	// add more env variables if needed
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
