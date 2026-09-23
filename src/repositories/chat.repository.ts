import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "../config/database.js";
import type {
  Conversation,
  ConversationParticipant,
  Message,
  MessageFile,
  MessageReply,
} from "../types/chat.types.js";

interface ConversationRow extends RowDataPacket {
  id: number;
  user_one_id: number;
  user_two_id: number;
  created_at: Date;
  updated_at: Date;
}

interface ConversationParticipantRow extends RowDataPacket {
  id: number;
  conversation_id: number;
  user_id: number;
  hidden_at: Date | null;
  created_at: Date;
}

interface MessageRow extends RowDataPacket {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  reply_to_message_id: number | null;

  reply_to_id: number | null;
  reply_to_sender_id: number | null;
  reply_to_content: string | null;
  reply_to_is_deleted: number | null;
  reply_to_created_at: Date | null;

  message_type: "text" | "file";

  file_id: number | null;
  file_message_id: number | null;
  file_original_name: string | null;
  file_stored_name: string | null;
  file_path: string | null;
  file_mime_type: string | null;
  file_size: number | null;
  file_downloaded_at: Date | null;
  file_created_at: Date | null;

  is_deleted: boolean;
  deleted_at: Date | null;
  created_at: Date;
}

interface ConversationListRow extends RowDataPacket {
  id: number;
  user_one_id: number;
  user_two_id: number;
  created_at: Date;
  updated_at: Date;

  other_user_id: number;
  other_user_name: string;
  other_user_email: string;

  last_message_content: string | null;
  last_message_is_deleted: number | null;
  last_message_sender_id: number | null;
  last_message_created_at: Date | null;
  last_message_type: "text" | "file" | null;

  last_message_reply_to_id: number | null;
  last_message_reply_to_sender_id: number | null;
  last_message_reply_to_content: string | null;
  last_message_reply_to_is_deleted: number | null;
  last_message_reply_to_created_at: Date | null;

  last_file_id: number | null;
  last_file_message_id: number | null;
  last_file_original_name: string | null;
  last_file_stored_name: string | null;
  last_file_path: string | null;
  last_file_mime_type: string | null;
  last_file_size: number | null;
  last_file_created_at: Date | null;
}

interface MessageFileRow extends RowDataPacket {
  id: number;
  message_id: number;
  conversation_id: number;
  original_name: string;
  stored_name: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  message_is_deleted: number;
  created_at: Date;
}

const mapMessageReply = (
  row: Pick<
    MessageRow,
    | "reply_to_id"
    | "reply_to_sender_id"
    | "reply_to_content"
    | "reply_to_is_deleted"
    | "reply_to_created_at"
  >,
): MessageReply | null => {
  if (
    row.reply_to_id === null ||
    row.reply_to_sender_id === null ||
    row.reply_to_created_at === null
  ) {
    return null;
  }

  return {
    id: row.reply_to_id,
    senderId: row.reply_to_sender_id,
    content: row.reply_to_is_deleted
      ? "This message was deleted"
      : (row.reply_to_content ?? ""),
    isDeleted: Boolean(row.reply_to_is_deleted),
    createdAt: row.reply_to_created_at,
  };
};

const mapMessageFile = (
  row: Pick<
    MessageRow,
    | "file_id"
    | "file_message_id"
    | "file_original_name"
    | "file_stored_name"
    | "file_path"
    | "file_mime_type"
    | "file_size"
    | "file_downloaded_at"
    | "file_created_at"
  >,
): MessageFile | null => {
  if (
    row.file_id === null ||
    row.file_message_id === null ||
    row.file_original_name === null ||
    row.file_stored_name === null ||
    row.file_path === null ||
    row.file_mime_type === null ||
    row.file_size === null ||
    row.file_created_at === null
  ) {
    return null;
  }

  return {
    id: row.file_id,
    messageId: row.file_message_id,
    originalName: row.file_original_name,
    storedName: row.file_stored_name,
    filePath: row.file_path,
    mimeType: row.file_mime_type,
    fileSize: Number(row.file_size),
    downloadedAt: row.file_downloaded_at,
    createdAt: row.file_created_at,
  };
};

const mapConversationRow = (row: ConversationRow): Conversation => ({
  id: row.id,
  userOneId: row.user_one_id,
  userTwoId: row.user_two_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapConversationParticipantRow = (
  row: ConversationParticipantRow,
): ConversationParticipant => ({
  id: row.id,
  conversationId: row.conversation_id,
  userId: row.user_id,
  hiddenAt: row.hidden_at,
  createdAt: row.created_at,
});

const mapMessageRow = (row: MessageRow): Message => ({
  id: row.id,
  conversationId: row.conversation_id,
  senderId: row.sender_id,
  content: row.content,
  replyToMessageId: row.reply_to_message_id,
  replyTo: mapMessageReply(row),
  messageType: row.message_type,
  file: mapMessageFile(row),
  isDeleted: Boolean(row.is_deleted),
  deletedAt: row.deleted_at,
  createdAt: row.created_at,
});

export const findConversationBetweenUsers = async (
  userOneId: number,
  userTwoId: number,
): Promise<Conversation | null> => {
  const [rows] = await pool.query<ConversationRow[]>(
    `
      SELECT
        id,
        user_one_id,
        user_two_id,
        created_at,
        updated_at
      FROM conversations
      WHERE
        (user_one_id = ? AND user_two_id = ?)
        OR
        (user_one_id = ? AND user_two_id = ?)
      LIMIT 1
    `,
    [userOneId, userTwoId, userTwoId, userOneId],
  );

  const conversation = rows[0];

  if (!conversation) {
    return null;
  }

  return mapConversationRow(conversation);
};

export const findConversationById = async (
  conversationId: number,
): Promise<Conversation | null> => {
  const [rows] = await pool.query<ConversationRow[]>(
    `
      SELECT
        id,
        user_one_id,
        user_two_id,
        created_at,
        updated_at
      FROM conversations
      WHERE id = ?
      LIMIT 1
    `,
    [conversationId],
  );

  const conversation = rows[0];

  if (!conversation) {
    return null;
  }

  return mapConversationRow(conversation);
};

export const createConversation = async (
  userOneId: number,
  userTwoId: number,
): Promise<number> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `
      INSERT INTO conversations (
        user_one_id,
        user_two_id
      )
      VALUES (?, ?)
    `,
    [userOneId, userTwoId],
  );

  return result.insertId;
};

export const findConversationParticipant = async (
  conversationId: number,
  userId: number,
): Promise<ConversationParticipant | null> => {
  const [rows] = await pool.query<ConversationParticipantRow[]>(
    `
      SELECT
        id,
        conversation_id,
        user_id,
        hidden_at,
        created_at
      FROM conversation_participants
      WHERE conversation_id = ?
        AND user_id = ?
      LIMIT 1
    `,
    [conversationId, userId],
  );

  const participant = rows[0];

  if (!participant) {
    return null;
  }

  return mapConversationParticipantRow(participant);
};

export const createConversationParticipant = async (
  conversationId: number,
  userId: number,
): Promise<number> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `
      INSERT INTO conversation_participants (
        conversation_id,
        user_id
      )
      VALUES (?, ?)
    `,
    [conversationId, userId],
  );

  return result.insertId;
};

export const hideConversationForUser = async (
  conversationId: number,
  userId: number,
): Promise<void> => {
  await pool.execute(
    `
      UPDATE conversation_participants
      SET hidden_at = CURRENT_TIMESTAMP
      WHERE conversation_id = ?
        AND user_id = ?
    `,
    [conversationId, userId],
  );
};

export const restoreConversationForUser = async (
  conversationId: number,
  userId: number,
): Promise<void> => {
  await pool.execute(
    `
      UPDATE conversation_participants
      SET hidden_at = NULL
      WHERE conversation_id = ?
        AND user_id = ?
    `,
    [conversationId, userId],
  );
};

const messageSelect = `
  SELECT
    m.id,
    m.conversation_id,
    m.sender_id,
    m.content,
    m.reply_to_message_id,

    rm.id AS reply_to_id,
    rm.sender_id AS reply_to_sender_id,
    rm.content AS reply_to_content,
    rm.is_deleted AS reply_to_is_deleted,
    rm.created_at AS reply_to_created_at,

    m.message_type,

    mf.id AS file_id,
    mf.message_id AS file_message_id,
    mf.original_name AS file_original_name,
    mf.stored_name AS file_stored_name,
    mf.file_path AS file_path,
    mf.mime_type AS file_mime_type,
    mf.file_size AS file_size,
    mfd.downloaded_at AS file_downloaded_at,
    mf.created_at AS file_created_at,

    m.is_deleted,
    m.deleted_at,
    m.created_at
  FROM messages m
  LEFT JOIN messages rm
    ON rm.id = m.reply_to_message_id
  LEFT JOIN message_files mf
    ON mf.message_id = m.id
  LEFT JOIN message_file_downloads mfd
    ON mfd.message_file_id = mf.id
   AND mfd.user_id = ?
`;

export const findMessagesByConversationId = async (
  conversationId: number,
  currentUserId: number,
): Promise<Message[]> => {
  const [rows] = await pool.query<MessageRow[]>(
    `
      ${messageSelect}
      WHERE m.conversation_id = ?
      ORDER BY m.created_at ASC, m.id ASC
    `,
    [currentUserId, conversationId],
  );

  return rows.map(mapMessageRow);
};

export const findMessageById = async (
  messageId: number,
  currentUserId?: number,
): Promise<Message | null> => {
  const [rows] = await pool.query<MessageRow[]>(
    `
      ${messageSelect}
      WHERE m.id = ?
      LIMIT 1
    `,
    [currentUserId ?? 0, messageId],
  );

  const message = rows[0];

  if (!message) {
    return null;
  }

  return mapMessageRow(message);
};

export const createMessage = async (
  conversationId: number,
  senderId: number,
  content: string,
  replyToMessageId: number | null,
  messageType: "text" | "file" = "text",
): Promise<number> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `
      INSERT INTO messages (
        conversation_id,
        sender_id,
        content,
        reply_to_message_id,
        message_type
      )
      VALUES (?, ?, ?, ?, ?)
    `,
    [conversationId, senderId, content, replyToMessageId, messageType],
  );

  return result.insertId;
};

export const createMessageFile = async (
  messageId: number,
  originalName: string,
  storedName: string,
  filePath: string,
  mimeType: string,
  fileSize: number,
): Promise<number> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `
      INSERT INTO message_files (
        message_id,
        original_name,
        stored_name,
        file_path,
        mime_type,
        file_size
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [messageId, originalName, storedName, filePath, mimeType, fileSize],
  );

  return result.insertId;
};

export const findMessageFileById = async (
  fileId: number,
): Promise<MessageFileRow | null> => {
  const [rows] = await pool.query<MessageFileRow[]>(
    `
      SELECT
        mf.id,
        mf.message_id,
        m.conversation_id,
        mf.original_name,
        mf.stored_name,
        mf.file_path,
        mf.mime_type,
        mf.file_size,
        m.is_deleted AS message_is_deleted,
        mf.created_at
      FROM message_files mf
      INNER JOIN messages m
        ON m.id = mf.message_id
      WHERE mf.id = ?
      LIMIT 1
    `,
    [fileId],
  );

  return rows[0] ?? null;
};

export const markMessageFileDownloaded = async (
  fileId: number,
  userId: number,
): Promise<void> => {
  await pool.execute(
    `
      INSERT INTO message_file_downloads (
        message_file_id,
        user_id
      )
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE
        downloaded_at = downloaded_at
    `,
    [fileId, userId],
  );
};

export const updateConversationTimestamp = async (
  conversationId: number,
): Promise<void> => {
  await pool.execute(
    `
      UPDATE conversations
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [conversationId],
  );
};

export const softDeleteMessage = async (messageId: number): Promise<void> => {
  await pool.execute(
    `
      UPDATE messages
      SET
        is_deleted = TRUE,
        deleted_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND is_deleted = FALSE
    `,
    [messageId],
  );
};

export const findConversationsByUserId = async (userId: number) => {
  const [rows] = await pool.query<ConversationListRow[]>(
    `
      SELECT
        c.id,
        c.user_one_id,
        c.user_two_id,
        c.created_at,
        c.updated_at,

        CASE
          WHEN c.user_one_id = ? THEN c.user_two_id
          ELSE c.user_one_id
        END AS other_user_id,

        CASE
          WHEN c.user_one_id = ? THEN u_two.name
          ELSE u_one.name
        END AS other_user_name,

        CASE
          WHEN c.user_one_id = ? THEN u_two.email
          ELSE u_one.email
        END AS other_user_email,

        m.content AS last_message_content,
        m.is_deleted AS last_message_is_deleted,
        m.sender_id AS last_message_sender_id,
        m.created_at AS last_message_created_at,
        m.message_type AS last_message_type,

        rm.id AS last_message_reply_to_id,
        rm.sender_id AS last_message_reply_to_sender_id,
        rm.content AS last_message_reply_to_content,
        rm.is_deleted AS last_message_reply_to_is_deleted,
        rm.created_at AS last_message_reply_to_created_at,

        mf.id AS last_file_id,
        mf.message_id AS last_file_message_id,
        mf.original_name AS last_file_original_name,
        mf.stored_name AS last_file_stored_name,
        mf.file_path AS last_file_path,
        mf.mime_type AS last_file_mime_type,
        mf.file_size AS last_file_size,
        mf.created_at AS last_file_created_at

      FROM conversations c

      INNER JOIN conversation_participants cp
        ON cp.conversation_id = c.id
        AND cp.user_id = ?
        AND cp.hidden_at IS NULL

      INNER JOIN users u_one
        ON u_one.id = c.user_one_id

      INNER JOIN users u_two
        ON u_two.id = c.user_two_id

      LEFT JOIN messages m
        ON m.id = (
          SELECT m2.id
          FROM messages m2
          WHERE m2.conversation_id = c.id
          ORDER BY m2.created_at DESC, m2.id DESC
          LIMIT 1
        )

      LEFT JOIN messages rm
        ON rm.id = m.reply_to_message_id

      LEFT JOIN message_files mf
        ON mf.message_id = m.id

      ORDER BY c.updated_at DESC, c.id DESC
    `,
    [userId, userId, userId, userId],
  );

  return rows;
};
