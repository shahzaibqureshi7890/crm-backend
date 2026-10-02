import { v2 as cloudinary } from "cloudinary";
import fs from "node:fs/promises";
(cloudinary as any).config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
export interface StoredChatFile {
  storedName: string;
  relativePath: string;
  absolutePath: string;
  publicId: string;
}
export const saveChatFile = async (
  temporaryPath: string,
  originalName: string,
): Promise<StoredChatFile> => {
  try {
    const result = await cloudinary.uploader.upload(temporaryPath, {
      folder: "crm/chat_files",
      resource_type: "auto",
    });
    await fs.unlink(temporaryPath).catch(() => {});
    return {
      storedName: result.public_id,
      relativePath: result.secure_url,
      absolutePath: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    await fs.unlink(temporaryPath).catch(() => {});
    throw error;
  }
};
export const deleteStoredChatFile = async (publicId: string): Promise<void> => {
  try {
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }
  } catch {}
};
