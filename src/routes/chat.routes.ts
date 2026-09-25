import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import {
  createConversation,
  deleteMessage,
  getConversations,
  getMessages,
  sendMessage,
  deleteConversationController,
  sendFileMessage,
  downloadFile,
} from "../controllers/chat.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
const router: Router = Router();
const chatStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "fleet_crm/chat_files",
    resource_type: "auto",
    allowed_formats: [
      "jpg",
      "png",
      "jpeg",
      "webp",
      "pdf",
      "txt",
      "csv",
      "doc",
      "docx",
      "xls",
      "xlsx",
      "ppt",
      "pptx",
      "zip",
    ],
  } as any,
});
const upload = multer({
  storage: chatStorage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
});
// Authentication
router.use(authMiddleware);
// Conversations
router.get("/", getConversations);
router.post("/", createConversation);
// Conversation Messages
router.get("/:id/messages", getMessages);
router.post("/:id/messages", sendMessage);
router.post("/:id/files", upload.single("file"), sendFileMessage);
// File Download
router.get("/files/:id/download", downloadFile);
// Messages
router.delete("/messages/:id", deleteMessage);
router.delete("/:id", deleteConversationController);
export default router;
