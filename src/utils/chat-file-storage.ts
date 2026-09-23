import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const CHAT_UPLOAD_DIRECTORY = path.join(process.cwd(), "uploads", "chat");

export interface StoredChatFile {
  storedName: string;
  relativePath: string;
  absolutePath: string;
}

export const saveChatFile = async (
  temporaryPath: string,
  originalName: string,
): Promise<StoredChatFile> => {
  const now = new Date();

  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");

  const extension = path.extname(originalName).toLowerCase();

  const storedName = `${crypto.randomUUID()}${extension}`;

  const relativeDirectory = path.join("uploads", "chat", year, month);

  const absoluteDirectory = path.join(process.cwd(), relativeDirectory);

  await fs.mkdir(absoluteDirectory, {
    recursive: true,
  });

  const absolutePath = path.join(absoluteDirectory, storedName);

  await fs.rename(temporaryPath, absolutePath);

  return {
    storedName,
    relativePath: path.join(relativeDirectory, storedName),
    absolutePath,
  };
};

export const deleteStoredChatFile = async (
  absolutePath: string,
): Promise<void> => {
  try {
    await fs.unlink(absolutePath);
  } catch {
    // File may already have been removed.
  }
};
