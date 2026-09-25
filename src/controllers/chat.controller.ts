import type { Request, RequestHandler, Response } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import {
  deleteChatMessage,
  deleteConversation,
  getChatFileForDownload,
  getConversationList,
  getConversationMessages,
  getOrCreateConversation,
  markChatFileDownloaded,
  sendChatFileMessage,
  sendChatMessage,
} from "../services/chat.service.js";
import {
  validateCreateConversationInput,
  validateFileCaption,
  validateIdParam,
  validateReplyMessageId,
  validateSendMessageInput,
} from "../validators/chat.validator.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { findConversationById } from "../repositories/chat.repository.js";
import { emitToUser } from "../socket/socket.io.js";
export const getConversations: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const authenticatedRequest = req as AuthenticatedRequest;
    const userId = authenticatedRequest.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }
    const conversations = await getConversationList(userId);
    res.status(200).json({
      success: true,
      conversations,
    });
  },
);
export const createConversation: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const authenticatedRequest = req as AuthenticatedRequest;
    const userId = authenticatedRequest.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }
    const conversationData = validateCreateConversationInput(req.body);
    const conversation = await getOrCreateConversation(
      userId,
      conversationData.otherUserId,
    );
    res.status(200).json({
      success: true,
      conversation,
    });
  },
);
export const getMessages: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const authenticatedRequest = req as AuthenticatedRequest;
    const userId = authenticatedRequest.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }
    const conversationId = validateIdParam(req.params.id, "conversation ID");
    const messages = await getConversationMessages(conversationId, userId);
    res.status(200).json({
      success: true,
      messages,
    });
  },
);
export const sendMessage: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const authenticatedRequest = req as AuthenticatedRequest;
    const userId = authenticatedRequest.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }
    const conversationId = validateIdParam(req.params.id, "conversation ID");
    const messageData = validateSendMessageInput(req.body);
    const message = await sendChatMessage(
      conversationId,
      userId,
      messageData.content,
      messageData.replyToMessageId,
    );
    res.status(201).json({
      success: true,
      message: "Message sent successfully.",
      data: message,
    });
  },
);
export const sendFileMessage: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const authenticatedRequest = req as AuthenticatedRequest;
    const userId = authenticatedRequest.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }
    const conversationId = validateIdParam(req.params.id, "conversation ID");
    const file = (
      req as Request & {
        file?: Express.Multer.File;
      }
    ).file;
    if (!file) {
      res.status(400).json({
        success: false,
        message: "File is required.",
      });
      return;
    }
    const caption = validateFileCaption(req.body?.caption);
    const replyToMessageId = validateReplyMessageId(req.body?.replyToMessageId);
    const message = await sendChatFileMessage(
      conversationId,
      userId,
      file,
      caption,
      replyToMessageId,
    );
    const conversation = await findConversationById(conversationId);
    if (conversation) {
      const otherUserId =
        conversation.userOneId === userId
          ? conversation.userTwoId
          : conversation.userOneId;
      emitToUser(otherUserId, "new_message", message);
    }
    res.status(201).json({
      success: true,
      message: "File sent successfully.",
      data: message,
    });
  },
);
export const downloadFile: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const authenticatedRequest = req as AuthenticatedRequest;
    const userId = authenticatedRequest.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }
    const fileId = validateIdParam(req.params.id, "file ID");
    const file = await getChatFileForDownload(fileId, userId);
    if (!file) {
      res.status(404).json({
        success: false,
        message: "File not found.",
      });
      return;
    }
    // Mark file as downloaded in database first
    try {
      await markChatFileDownloaded(file.id, userId);
    } catch {
      // Tracking failure should not block file access
    }
    // Redirect to Cloudinary secure URL so the browser can download/view it directly
    res.redirect(file.file_path);
  },
);
export const deleteMessage: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const authenticatedRequest = req as AuthenticatedRequest;
    const userId = authenticatedRequest.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }
    const messageId = validateIdParam(req.params.id, "message ID");
    const message = await deleteChatMessage(messageId, userId);
    res.status(200).json({
      success: true,
      message: "Message deleted successfully.",
      data: message,
    });
  },
);
export const deleteConversationController: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const authenticatedRequest = req as AuthenticatedRequest;
    const userId = authenticatedRequest.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }
    const conversationId = validateIdParam(req.params.id, "conversation ID");
    await deleteConversation(conversationId, userId);
    res.status(200).json({
      success: true,
      message: "Conversation deleted successfully.",
    });
  },
);
