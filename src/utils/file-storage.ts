import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import type { Express } from "express";

const UPLOADS_ROOT = path.resolve(process.cwd(), "uploads");

export const getTruckUploadDirectory = (truckId: number): string => {
  return path.join(UPLOADS_ROOT, "trucks", String(truckId));
};

export const getTruckFeaturedDirectory = (truckId: number): string => {
  return path.join(getTruckUploadDirectory(truckId), "featured");
};

export const getTruckGalleryDirectory = (truckId: number): string => {
  return path.join(getTruckUploadDirectory(truckId), "gallery");
};

const ensureDirectory = async (directory: string): Promise<void> => {
  await fs.mkdir(directory, {
    recursive: true,
  });
};

const generateUniqueFileName = (originalName: string): string => {
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);

  const safeBaseName = baseName
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-");

  return `${safeBaseName || "image"}-${randomUUID()}${extension.toLowerCase()}`;
};

export const saveTruckFeaturedImage = async (
  truckId: number,
  file: Express.Multer.File,
): Promise<string> => {
  const directory = getTruckFeaturedDirectory(truckId);

  await ensureDirectory(directory);

  const fileName = generateUniqueFileName(file.originalname);

  const filePath = path.join(directory, fileName);

  await fs.writeFile(filePath, file.buffer);

  return fileName;
};

export const saveTruckGalleryImages = async (
  truckId: number,
  files: Express.Multer.File[],
): Promise<string[]> => {
  const directory = getTruckGalleryDirectory(truckId);

  await ensureDirectory(directory);

  const fileNames: string[] = [];

  for (const file of files) {
    const fileName = generateUniqueFileName(file.originalname);

    const filePath = path.join(directory, fileName);

    await fs.writeFile(filePath, file.buffer);

    fileNames.push(fileName);
  }

  return fileNames;
};

export const deleteTruckFeaturedImage = async (
  truckId: number,
  fileName: string | null,
): Promise<void> => {
  if (!fileName) {
    return;
  }

  const filePath = path.join(getTruckFeaturedDirectory(truckId), fileName);

  await deleteFileIfExists(filePath);
};

export const deleteTruckGalleryImage = async (
  truckId: number,
  fileName: string,
): Promise<void> => {
  const filePath = path.join(getTruckGalleryDirectory(truckId), fileName);

  await deleteFileIfExists(filePath);
};

export const deleteTruckUploadDirectory = async (
  truckId: number,
): Promise<void> => {
  const directory = getTruckUploadDirectory(truckId);

  await fs.rm(directory, {
    recursive: true,
    force: true,
  });
};

export const getDriverUploadDirectory = (driverId: number): string => {
  return path.join(UPLOADS_ROOT, "drivers", String(driverId));
};

export const getDriverProfileDirectory = (driverId: number): string => {
  return path.join(getDriverUploadDirectory(driverId), "profile");
};

export const saveDriverProfileImage = async (
  driverId: number,
  file: Express.Multer.File,
): Promise<string> => {
  const directory = getDriverProfileDirectory(driverId);

  await ensureDirectory(directory);

  const fileName = generateUniqueFileName(file.originalname);

  const filePath = path.join(directory, fileName);

  await fs.writeFile(filePath, file.buffer);

  return fileName;
};

export const deleteDriverProfileImage = async (
  driverId: number,
  fileName: string | null,
): Promise<void> => {
  if (!fileName) {
    return;
  }

  const filePath = path.join(getDriverProfileDirectory(driverId), fileName);

  await deleteFileIfExists(filePath);
};

export const deleteDriverUploadDirectory = async (
  driverId: number,
): Promise<void> => {
  const directory = getDriverUploadDirectory(driverId);

  await fs.rm(directory, {
    recursive: true,
    force: true,
  });
};

const deleteFileIfExists = async (filePath: string): Promise<void> => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;

    if (nodeError.code !== "ENOENT") {
      throw error;
    }
  }
};
