export interface Conversation {
  id: number;
  userOneId: number;
  userTwoId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationParticipant {
  id: number;
  conversationId: number;
  userId: number;
  hiddenAt: Date | null;
  createdAt: Date;
}

export interface MessageReply {
  id: number;
  senderId: number;
  content: string;
  isDeleted: boolean;
  createdAt: Date;
}

export interface MessageFile {
  id: number;
  messageId: number;
  originalName: string;
  storedName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  downloadedAt: Date | null;
  createdAt: Date;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  replyToMessageId: number | null;
  replyTo: MessageReply | null;
  messageType: "text" | "file";
  file: MessageFile | null;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
}

export interface ChatMessageResponse {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  replyTo: MessageReply | null;
  messageType: "text" | "file";
  file: MessageFile | null;
  isDeleted: boolean;
  createdAt: Date;
}

export interface CreateConversationData {
  otherUserId: number;
}

export interface SendMessageData {
  conversationId: number;
  senderId: number;
  content: string;
  replyToMessageId: number | null;
}

export interface SendFileMessageData {
  conversationId: number;
  senderId: number;
  content: string;
  replyToMessageId: number | null;
}

export interface ConversationListItem {
  id: number;
  otherUser: {
    id: number;
    name: string;
    email: string;
  };
  lastMessage: {
    content: string;
    isDeleted: boolean;
    senderId: number;
    createdAt: Date;
    replyTo: MessageReply | null;
    messageType: "text" | "file";
    file: MessageFile | null;
  } | null;
  updatedAt: Date;
}
