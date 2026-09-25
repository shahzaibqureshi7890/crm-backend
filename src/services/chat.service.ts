import { AppError } from "../errors/app.error.js";
import { findUserById } from "../repositories/user.repository.js";
import {
  createConversation,
  createConversationParticipant,
  createMessage,
  createMessageFile,
  findConversationById,
  findConversationBetweenUsers,
  findConversationParticipant,
  findMessageById,
  findMessagesByConversationId,
  restoreConversationForUser,
  softDeleteMessage,
  updateConversationTimestamp,
  findConversationsByUserId,
  hideConversationForUser,
  findMessageFileById,
  markMessageFileDownloaded,
} from "../repositories/chat.repository.js";
import type {
  ChatMessageResponse,
  Conversation,
  ConversationListItem,
  Message,
} from "../types/chat.types.js";
import { v2 as cloudinary } from "cloudinary";
const MAX_CHAT_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
]);
const getOrderedUserIds = (
  userOneId: number,
  userTwoId: number,
): [number, number] => {
  return userOneId < userTwoId
    ? [userOneId, userTwoId]
    : [userTwoId, userOneId];
};
export const getOrCreateConversation = async (
  currentUserId: number,
  otherUserId: number,
): Promise<Conversation> => {
  if (currentUserId === otherUserId) {
    throw new AppError("You cannot start a conversation with yourself.", 400);
  }
  const otherUser = await findUserById(otherUserId);
  if (!otherUser) {
    throw new AppError("User not found.", 404);
  }
  const [userOneId, userTwoId] = getOrderedUserIds(currentUserId, otherUserId);
  let conversation = await findConversationBetweenUsers(userOneId, userTwoId);
  if (!conversation) {
    const conversationId = await createConversation(userOneId, userTwoId);
    await createConversationParticipant(conversationId, userOneId);
    await createConversationParticipant(conversationId, userTwoId);
    conversation = await findConversationById(conversationId);
    if (!conversation) {
      throw new AppError("Failed to create conversation.", 500);
    }
  }
  return conversation;
};
export const getConversationMessages = async (
  conversationId: number,
  currentUserId: number,
): Promise<ChatMessageResponse[]> => {
  const conversation = await findConversationById(conversationId);
  if (!conversation) {
    throw new AppError("Conversation not found.", 404);
  }
  const participant = await findConversationParticipant(
    conversationId,
    currentUserId,
  );
  if (!participant) {
    throw new AppError("You are not a participant in this conversation.", 403);
  }
  const messages = await findMessagesByConversationId(
    conversationId,
    currentUserId,
  );
  return messages.map(mapMessageResponse);
};
export const sendChatMessage = async (
  conversationId: number,
  senderId: number,
  content: string,
  replyToMessageId: number | null = null,
): Promise<ChatMessageResponse> => {
  const conversation = await findConversationById(conversationId);
  if (!conversation) {
    throw new AppError("Conversation not found.", 404);
  }
  const participant = await findConversationParticipant(
    conversationId,
    senderId,
  );
  if (!participant) {
    throw new AppError("You are not a participant in this conversation.", 403);
  }
  const trimmedContent = content.trim();
  if (!trimmedContent) {
    throw new AppError("Message cannot be empty.", 400);
  }
  await validateReplyTarget(conversationId, senderId, replyToMessageId);
  await restoreConversationForUser(conversationId, senderId);
  const messageId = await createMessage(
    conversationId,
    senderId,
    trimmedContent,
    replyToMessageId,
    "text",
  );
  await updateConversationTimestamp(conversationId);
  const message = await findMessageById(messageId, senderId);
  if (!message) {
    throw new AppError("Failed to create message.", 500);
  }
  return mapMessageResponse(message);
};
export const sendChatFileMessage = async (
  conversationId: number,
  senderId: number,
  file: Express.Multer.File,
  caption: string,
  replyToMessageId: number | null = null,
): Promise<ChatMessageResponse> => {
  const conversation = await findConversationById(conversationId);
  if (!conversation) {
    throw new AppError("Conversation not found.", 404);
  }
  const participant = await findConversationParticipant(
    conversationId,
    senderId,
  );
  if (!participant) {
    throw new AppError("You are not a participant in this conversation.", 403);
  }
  if (!file) {
    throw new AppError("File is required.", 400);
  }
  if (file.size <= 0) {
    throw new AppError("Uploaded file is empty.", 400);
  }
  if (file.size > MAX_CHAT_FILE_SIZE) {
    throw new AppError("File size cannot exceed 10 MB.", 400);
  }
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw new AppError("This file type is not allowed.", 400);
  }
  await validateReplyTarget(conversationId, senderId, replyToMessageId);
  // When using multer-storage-cloudinary, file.path contains the secure URL,
  // and file.filename (or file.filename / public_id) holds the identifier.
  const fileUrl = file.path;
  const storedName = file.filename || file.originalname;
  try {
    await restoreConversationForUser(conversationId, senderId);
    const messageId = await createMessage(
      conversationId,
      senderId,
      caption,
      replyToMessageId,
      "file",
    );
    await createMessageFile(
      messageId,
      file.originalname,
      storedName,
      fileUrl, // Saving Cloudinary secure URL as filePath
      file.mimetype,
      file.size,
    );
    await updateConversationTimestamp(conversationId);
    const message = await findMessageById(messageId, senderId);
    if (!message) {
      throw new AppError("Failed to create file message.", 500);
    }
    return mapMessageResponse(message);
  } catch (error) {
    // If message creation fails, delete the uploaded file from Cloudinary using URL
    if (fileUrl) {
      try {
        const regex = /\/v\d+\/(.+)\.[a-zA-Z0-9]+$/;
        const match = fileUrl.match(regex);
        if (match && match[1]) {
          await cloudinary.uploader.destroy(match[1]);
        }
      } catch (cloudinaryError) {
        console.error("Failed to cleanup Cloudinary file:", cloudinaryError);
      }
    }
    throw error;
  }
};
const validateReplyTarget = async (
  conversationId: number,
  senderId: number,
  replyToMessageId: number | null,
): Promise<void> => {
  if (replyToMessageId === null) {
    return;
  }
  const replyToMessage = await findMessageById(replyToMessageId, senderId);
  if (!replyToMessage) {
    throw new AppError("Reply message not found.", 404);
  }
  if (replyToMessage.conversationId !== conversationId) {
    throw new AppError(
      "You can only reply to a message from the same conversation.",
      400,
    );
  }
  if (replyToMessage.senderId === senderId) {
    throw new AppError("You can only reply to received messages.", 403);
  }
};
export const deleteChatMessage = async (
  messageId: number,
  currentUserId: number,
): Promise<ChatMessageResponse> => {
  const message = await findMessageById(messageId, currentUserId);
  if (!message) {
    throw new AppError("Message not found.", 404);
  }
  if (message.senderId !== currentUserId) {
    throw new AppError("You can only delete your own messages.", 403);
  }
  if (message.isDeleted) {
    throw new AppError("Message has already been deleted.", 409);
  }
  const participant = await findConversationParticipant(
    message.conversationId,
    currentUserId,
  );
  if (!participant) {
    throw new AppError("You are not a participant in this conversation.", 403);
  }
  await softDeleteMessage(messageId);
  const updatedMessage = await findMessageById(messageId, currentUserId);
  if (!updatedMessage) {
    throw new AppError("Failed to delete message.", 500);
  }
  return mapMessageResponse(updatedMessage);
};
const mapMessageResponse = (message: Message): ChatMessageResponse => ({
  id: message.id,
  conversationId: message.conversationId,
  senderId: message.senderId,
  content: message.isDeleted ? "This message was deleted" : message.content,
  replyTo: message.replyTo,
  messageType: message.messageType,
  file: message.isDeleted ? null : message.file,
  isDeleted: message.isDeleted,
  createdAt: message.createdAt,
});
export const getChatFileForDownload = async (
  fileId: number,
  currentUserId: number,
): Promise<Awaited<ReturnType<typeof findMessageFileById>>> => {
  const file = await findMessageFileById(fileId);
  if (!file) {
    throw new AppError("File not found.", 404);
  }
  if (Boolean(file.message_is_deleted)) {
    throw new AppError("This file is no longer available.", 404);
  }
  const participant = await findConversationParticipant(
    file.conversation_id,
    currentUserId,
  );
  if (!participant) {
    throw new AppError("You are not authorized to access this file.", 403);
  }
  return file;
};
export const markChatFileDownloaded = async (
  fileId: number,
  currentUserId: number,
): Promise<void> => {
  const file = await getChatFileForDownload(fileId, currentUserId);
  if (!file) {
    throw new AppError("File not found.", 404);
  }
  await markMessageFileDownloaded(file.id, currentUserId);
};
export const deleteConversation = async (
  conversationId: number,
  currentUserId: number,
): Promise<void> => {
  const conversation = await findConversationById(conversationId);
  if (!conversation) {
    throw new AppError("Conversation not found.", 404);
  }
  const participant = await findConversationParticipant(
    conversationId,
    currentUserId,
  );
  if (!participant) {
    throw new AppError("You are not a participant in this conversation.", 403);
  }
  await hideConversationForUser(conversationId, currentUserId);
};
export const getConversationList = async (
  currentUserId: number,
): Promise<ConversationListItem[]> => {
  const conversations = await findConversationsByUserId(currentUserId);
  return conversations.map((conversation) => ({
    id: conversation.id,
    otherUser: {
      id: conversation.other_user_id,
      name: conversation.other_user_name,
      email: conversation.other_user_email,
    },
    lastMessage:
      conversation.last_message_sender_id === null
        ? null
        : {
            content: conversation.last_message_is_deleted
              ? "This message was deleted"
              : conversation.last_message_type === "file" &&
                  !conversation.last_message_content
                ? "File"
                : (conversation.last_message_content ?? ""),
            isDeleted: Boolean(conversation.last_message_is_deleted),
            senderId: conversation.last_message_sender_id,
            createdAt: conversation.last_message_created_at!,
            replyTo:
              conversation.last_message_reply_to_id === null
                ? null
                : {
                    id: conversation.last_message_reply_to_id,
                    senderId: conversation.last_message_reply_to_sender_id!,
                    content: conversation.last_message_reply_to_is_deleted
                      ? "This message was deleted"
                      : (conversation.last_message_reply_to_content ?? ""),
                    isDeleted: Boolean(
                      conversation.last_message_reply_to_is_deleted,
                    ),
                    createdAt: conversation.last_message_reply_to_created_at!,
                  },
            messageType: conversation.last_message_type ?? "text",
            file:
              conversation.last_file_id === null
                ? null
                : {
                    id: conversation.last_file_id,
                    messageId: conversation.last_file_message_id!,
                    originalName: conversation.last_file_original_name!,
                    storedName: conversation.last_file_stored_name!,
                    filePath: conversation.last_file_path!,
                    mimeType: conversation.last_file_mime_type!,
                    fileSize: Number(conversation.last_file_size),
                    downloadedAt: null,
                    createdAt: conversation.last_file_created_at!,
                  },
          },
    updatedAt: conversation.updated_at,
  }));
};
