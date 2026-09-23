import type { Server } from "socket.io";
import {
  deleteChatMessage,
  deleteConversation,
  sendChatMessage,
} from "../services/chat.service.js";
import { findConversationById } from "../repositories/chat.repository.js";
import type { AuthenticatedSocket } from "./socket.types.js";
interface SendMessagePayload {
  conversationId: number;
  content: string;
  replyToMessageId?: number | null;
}
interface DeleteMessagePayload {
  messageId: number;
}
const isValidPositiveInteger = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
};
const getUserRoom = (userId: number): string => {
  return `user:${userId}`;
};
export const registerChatSocket = (
  io: Server,
  socket: AuthenticatedSocket,
): void => {
  const currentUserId = socket.data.user?.userId;
  if (!currentUserId) {
    socket.disconnect();
    return;
  }
  socket.join(getUserRoom(currentUserId));
  socket.on("send_message", async (payload: SendMessagePayload) => {
    try {
      if (
        !payload ||
        !isValidPositiveInteger(payload.conversationId) ||
        typeof payload.content !== "string" ||
        (payload.replyToMessageId !== undefined &&
          payload.replyToMessageId !== null &&
          !isValidPositiveInteger(payload.replyToMessageId))
      ) {
        socket.emit("chat_error", {
          event: "send_message",
          message: "Invalid message data.",
        });
        return;
      }
      const conversation = await findConversationById(payload.conversationId);
      if (!conversation) {
        socket.emit("chat_error", {
          event: "send_message",
          message: "Conversation not found.",
        });
        return;
      }
      if (
        conversation.userOneId !== currentUserId &&
        conversation.userTwoId !== currentUserId
      ) {
        socket.emit("chat_error", {
          event: "send_message",
          message: "You are not a participant in this conversation.",
        });
        return;
      }
      const message = await sendChatMessage(
        payload.conversationId,
        currentUserId,
        payload.content,
        payload.replyToMessageId ?? null,
      );
      const otherUserId =
        conversation.userOneId === currentUserId
          ? conversation.userTwoId
          : conversation.userOneId;
      io.to(getUserRoom(currentUserId)).emit("message_sent", message);
      io.to(getUserRoom(otherUserId)).emit("new_message", message);
    } catch (error) {
      socket.emit("chat_error", {
        event: "send_message",
        message:
          error instanceof Error ? error.message : "Failed to send message.",
      });
    }
  });
  socket.on("delete_message", async (payload: DeleteMessagePayload) => {
    try {
      if (!payload || !isValidPositiveInteger(payload.messageId)) {
        socket.emit("chat_error", {
          event: "delete_message",
          message: "Invalid message ID.",
        });
        return;
      }
      const message = await deleteChatMessage(payload.messageId, currentUserId);
      const conversation = await findConversationById(message.conversationId);
      if (!conversation) {
        socket.emit("chat_error", {
          event: "delete_message",
          message: "Conversation not found.",
        });
        return;
      }
      const otherUserId =
        conversation.userOneId === currentUserId
          ? conversation.userTwoId
          : conversation.userOneId;
      io.to(getUserRoom(currentUserId)).emit("message_deleted", message);
      io.to(getUserRoom(otherUserId)).emit("message_deleted", message);
    } catch (error) {
      socket.emit("chat_error", {
        event: "delete_message",
        message:
          error instanceof Error ? error.message : "Failed to delete message.",
      });
    }
  });
  socket.on(
    "delete_conversation",
    async (payload: { conversationId: number }) => {
      try {
        if (!payload || !isValidPositiveInteger(payload.conversationId)) {
          socket.emit("chat_error", {
            event: "delete_conversation",
            message: "Invalid conversation ID.",
          });
          return;
        }
        await deleteConversation(payload.conversationId, currentUserId);
        io.to(getUserRoom(currentUserId)).emit("conversation_deleted", {
          conversationId: payload.conversationId,
        });
      } catch (error) {
        socket.emit("chat_error", {
          event: "delete_conversation",
          message:
            error instanceof Error
              ? error.message
              : "Failed to delete conversation.",
        });
      }
    },
  );
};
