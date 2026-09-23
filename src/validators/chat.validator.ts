import type {
  CreateConversationData,
  SendMessageData,
} from "../types/chat.types.js";
import { AppError } from "../errors/app.error.js";
export const validateCreateConversationInput = (
  input: unknown,
): CreateConversationData => {
  if (!input || typeof input !== "object") {
    throw new AppError("Request body is required.", 400);
  }
  const { otherUserId } = input as Record<string, unknown>;
  if (
    typeof otherUserId !== "number" ||
    !Number.isInteger(otherUserId) ||
    otherUserId <= 0
  ) {
    throw new AppError("A valid user ID is required.", 400);
  }
  return {
    otherUserId,
  };
};
export const validateSendMessageInput = (
  input: unknown,
): Omit<SendMessageData, "conversationId" | "senderId"> => {
  if (!input || typeof input !== "object") {
    throw new AppError("Request body is required.", 400);
  }
  const { content, replyToMessageId } = input as Record<string, unknown>;
  if (typeof content !== "string" || content.trim().length === 0) {
    throw new AppError("Message cannot be empty.", 400);
  }
  if (
    replyToMessageId !== undefined &&
    replyToMessageId !== null &&
    (typeof replyToMessageId !== "number" ||
      !Number.isInteger(replyToMessageId) ||
      replyToMessageId <= 0)
  ) {
    throw new AppError("Invalid reply message ID.", 400);
  }
  return {
    content: content.trim(),
    replyToMessageId:
      replyToMessageId === undefined || replyToMessageId === null
        ? null
        : replyToMessageId,
  };
};
export const validateFileCaption = (value: unknown): string => {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value !== "string") {
    throw new AppError("Invalid file caption.", 400);
  }
  return value.trim();
};
export const validateReplyMessageId = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const numericValue = typeof value === "string" ? Number(value) : value;
  if (
    typeof numericValue !== "number" ||
    !Number.isInteger(numericValue) ||
    numericValue <= 0
  ) {
    throw new AppError("Invalid reply message ID.", 400);
  }
  return numericValue;
};
export const validateIdParam = (
  value: string | string[] | undefined,
  fieldName: string,
): number => {
  if (typeof value !== "string" || value.trim() === "") {
    throw new AppError(`Invalid ${fieldName}.`, 400);
  }
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(`Invalid ${fieldName}.`, 400);
  }
  return id;
};
