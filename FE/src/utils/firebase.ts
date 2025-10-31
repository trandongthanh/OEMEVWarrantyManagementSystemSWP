import { initializeApp, getApps, FirebaseOptions } from "firebase/app";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  FirebaseStorage,
} from "firebase/storage";

/**
 * Initialize Firebase app and return Storage instance.
 * Uses Vite env vars: VITE_FIREBASE_*
 */
function getFirebaseStorage(): FirebaseStorage {
  if (typeof window === "undefined") {
    throw new Error("Firebase storage is only available in the browser");
  }

  const {
    VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_AUTH_DOMAIN,
    VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_STORAGE_BUCKET,
    VITE_FIREBASE_MESSAGING_SENDER_ID,
    VITE_FIREBASE_APP_ID,
  } = import.meta.env;

  if (!VITE_FIREBASE_API_KEY || !VITE_FIREBASE_PROJECT_ID || !VITE_FIREBASE_STORAGE_BUCKET) {
    throw new Error(
      "Firebase config missing. Please set VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID and VITE_FIREBASE_STORAGE_BUCKET in your environment."
    );
  }

  const firebaseConfig = {
    apiKey: VITE_FIREBASE_API_KEY,
    authDomain: VITE_FIREBASE_AUTH_DOMAIN,
    projectId: VITE_FIREBASE_PROJECT_ID,
    storageBucket: VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: VITE_FIREBASE_APP_ID,
  };

  if (!getApps().length) {
    const cfg = firebaseConfig as FirebaseOptions;
    initializeApp(cfg);
  }

  return getStorage();
}

function sanitizeFileName(name: string) {
  const parts = name.split('.');
  const ext = parts.length > 1 ? parts.pop() : '';
  const base = parts.join('.').replace(/[^a-zA-Z0-9_.-]/g, '_');
  const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  return ext ? `${unique}_${base}.${ext}` : `${unique}_${base}`;
}

/**
 * Upload a File to Firebase Storage and return the download URL.
 * Accepts an optional onProgress callback that receives percent (0-100).
 */
export async function uploadImageToFirebase(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  try {
    if (!file) throw new Error("No file provided to uploadImageToFirebase");

    const storage = getFirebaseStorage();

    const safeName = sanitizeFileName(file.name || 'upload');
    const filePath = `caselines/${safeName}`;
    const storageRef = ref(storage, filePath);

    const uploadTask = uploadBytesResumable(storageRef, file);

    return await new Promise<string>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (onProgress && snapshot.totalBytes) {
            const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            try {
              onProgress(percent);
            } catch (e) {
              // swallow progress callback errors
              console.warn('onProgress callback error', e);
            }
          }
        },
        (error) => {
          console.error('uploadImageToFirebase upload error:', error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (err) {
            reject(err);
          }
        }
      );
    });
  } catch (error) {
    console.error('uploadImageToFirebase error:', error);
    throw error;
  }
}

/**
 * Upload multiple files sequentially and return array of URLs.
 * onProgress receives (index, percent) for each file.
 */
export async function uploadImagesToFirebase(
  files: File[],
  onProgress?: (index: number, percent: number) => void
): Promise<string[]> {
  const results: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const url = await uploadImageToFirebase(files[i], (p) => onProgress?.(i, p));
    results.push(url);
  }
  return results;
}

export default uploadImageToFirebase;
