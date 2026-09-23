import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
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
// Self-healing temporary upload directory setup (tries local cwd, falls back to os.tmpdir() if read-only)
let temporaryUploadDirectory = path.join(process.cwd(), "uploads", "tmp");
try {
  if (!fs.existsSync(temporaryUploadDirectory)) {
    fs.mkdirSync(temporaryUploadDirectory, { recursive: true });
  }
} catch (error) {
  temporaryUploadDirectory = path.join(os.tmpdir(), "uploads", "tmp");
  if (!fs.existsSync(temporaryUploadDirectory)) {
    fs.mkdirSync(temporaryUploadDirectory, { recursive: true });
  }
}
const upload = multer({
  dest: temporaryUploadDirectory,
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
