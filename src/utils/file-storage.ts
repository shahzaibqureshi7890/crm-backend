import type { Express } from "express";
import { v2 as cloudinary } from "cloudinary";
/**
 * When using CloudinaryStorage with multer, file.path contains the secure Cloudinary URL,
 * and file.filename contains the Cloudinary public_id.
 */
export const saveTruckFeaturedImage = async (
  _truckId: number,
  file: Express.Multer.File,
): Promise<string> => {
  // file.path holds the Cloudinary URL from multer-storage-cloudinary
  return file.path;
};
export const saveTruckGalleryImages = async (
  _truckId: number,
  files: Express.Multer.File[],
): Promise<string[]> => {
  return files.map((file) => file.path);
};
export const deleteTruckFeaturedImage = async (
  _truckId: number,
  fileUrl: string | null,
): Promise<void> => {
  if (!fileUrl) return;
  await deleteCloudinaryFileByUrl(fileUrl);
};
export const deleteTruckGalleryImage = async (
  _truckId: number,
  fileUrl: string,
): Promise<void> => {
  await deleteCloudinaryFileByUrl(fileUrl);
};
export const deleteTruckUploadDirectory = async (
  _truckId: number,
): Promise<void> => {
  // Cloudinary files are managed via public IDs or URLs; individual cleanup is handled above.
};
export const saveDriverProfileImage = async (
  _driverId: number,
  file: Express.Multer.File,
): Promise<string> => {
  return file.path;
};
export const deleteDriverProfileImage = async (
  _driverId: number,
  fileUrl: string | null,
): Promise<void> => {
  if (!fileUrl) return;
  await deleteCloudinaryFileByUrl(fileUrl);
};
export const deleteDriverUploadDirectory = async (
  _driverId: number,
): Promise<void> => {};
// Helper to delete an asset from Cloudinary using its secure URL
const deleteCloudinaryFileByUrl = async (fileUrl: string): Promise<void> => {
  try {
    // Extract public ID from Cloudinary URL if possible, or handle deletion
    const regex = /\/v\d+\/(.+)\.[a-zA-Z0-9]+$/;
    const match = fileUrl.match(regex);
    if (match && match[1]) {
      const publicId = match[1];
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.error("Failed to delete file from Cloudinary:", error);
  }
};
