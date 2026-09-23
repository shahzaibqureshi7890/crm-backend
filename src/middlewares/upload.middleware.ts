import multer from "multer";

const storage = multer.memoryStorage();

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
