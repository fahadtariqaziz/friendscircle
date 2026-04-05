import { CLOUDINARY_UPLOAD_PRESET } from "@friendscircle/shared";

const CLOUDINARY_CLOUD_NAME =
  process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ||
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
  "";

const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadImage(
  file: File | Blob | string,
  folder: string = "posts"
): Promise<CloudinaryResponse> {
  // Validate file type and size for File/Blob uploads
  if (file instanceof Blob) {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error("File too large. Maximum size is 10MB.");
    }
    if (file instanceof File && file.type && !ALLOWED_TYPES.includes(file.type)) {
      throw new Error("Invalid file type. Allowed: JPEG, PNG, WebP, GIF.");
    }
  }

  const formData = new FormData();
  formData.append("file", file);

  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", `friendscircle/${folder}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("Upload timed out. Please try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export function getImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
  } = {}
): string {
  const { width, height, crop = "fill", quality = "auto" } = options;

  let transforms = `q_${quality},f_auto`;
  if (width) transforms += `,w_${width}`;
  if (height) transforms += `,h_${height}`;
  if (width || height) transforms += `,c_${crop}`;

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transforms}/${publicId}`;
}

export function getThumbnailUrl(publicId: string): string {
  return getImageUrl(publicId, { width: 200, height: 200, crop: "thumb" });
}

export function getPostImageUrl(publicId: string): string {
  return getImageUrl(publicId, { width: 800, quality: "auto" });
}

export function getAvatarUrl(publicId: string): string {
  return getImageUrl(publicId, { width: 150, height: 150, crop: "thumb" });
}
