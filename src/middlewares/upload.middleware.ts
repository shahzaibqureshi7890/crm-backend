import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
// Cloudinary credentials configure karein
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
} as any); // 👈 Yahan 'as any' lagane se env type ka error khatam ho jayega
// Cloudinary storage engine setup
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "crm_uploads",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  } as any, // 👈 Yahan bhi 'as any' lagana zaroori hai
});
const imageFileFilter: multer.Options["fileFilter"] = (
  _req,
  file,
  callback,
) => {
  if (!file.mimetype.startsWith("image/")) {
    callback(new Error("Only image files are allowed."));
    return;
  }
  callback(null, true);
};
export const uploadImages = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
  },
});
