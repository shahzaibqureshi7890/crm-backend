import { AppError } from "../errors/app.error.js";
import {
  createDriver as createDriverRepository,
  deleteDriver,
  findAllDrivers,
  findDriverByEmail,
  findDriverById,
  findDriverByLicenseNumber,
  findDriverByName,
  updateDriver as updateDriverRepository,
} from "../repositories/driver.repository.js";
import { findTruckById } from "../repositories/truck.repository.js";
import type {
  CreateDriverData,
  Driver,
  UpdateDriverData,
} from "../types/driver.types.js";
import { deleteDriverProfileImage } from "../utils/file-storage.js";
interface DriverUploadFiles {
  profileImage?: Express.Multer.File;
}
const validateTruckAssignment = async (
  truckId: number | null,
): Promise<void> => {
  if (truckId === null) {
    return;
  }
  const truck = await findTruckById(truckId);
  if (!truck) {
    throw new AppError("Assigned truck not found.", 404);
  }
};
const validateDriverUniqueness = async (
  driverData: CreateDriverData | UpdateDriverData,
  currentDriverId?: number,
): Promise<void> => {
  const existingDriverByName = await findDriverByName(driverData.name);
  if (existingDriverByName && existingDriverByName.id !== currentDriverId) {
    throw new AppError("Driver name already exists.", 409);
  }
  if (driverData.email) {
    const existingDriverByEmail = await findDriverByEmail(driverData.email);
    if (existingDriverByEmail && existingDriverByEmail.id !== currentDriverId) {
      throw new AppError("Email already exists.", 409);
    }
  }
  const existingDriverByLicenseNumber = await findDriverByLicenseNumber(
    driverData.licenseNumber,
  );
  if (
    existingDriverByLicenseNumber &&
    existingDriverByLicenseNumber.id !== currentDriverId
  ) {
    throw new AppError("License Number already exists.", 409);
  }
};
const getDuplicateDriverField = (
  error: unknown,
): "name" | "email" | "licenseNumber" | null => {
  if (!(error instanceof Error)) {
    return null;
  }
  const databaseError = error as Error & {
    code?: string;
  };
  if (databaseError.code !== "ER_DUP_ENTRY") {
    return null;
  }
  const message = databaseError.message.toLowerCase();
  if (message.includes("unique_driver_name")) {
    return "name";
  }
  if (message.includes("for key 'email'")) {
    return "email";
  }
  if (message.includes("for key 'license_number'")) {
    return "licenseNumber";
  }
  return null;
};
export const getAllDrivers = async (): Promise<Driver[]> => {
  return findAllDrivers();
};
export const getDriverById = async (driverId: number): Promise<Driver> => {
  const driver = await findDriverById(driverId);
  if (!driver) {
    throw new AppError("Driver not found.", 404);
  }
  return driver;
};
export const createDriver = async (
  driverData: CreateDriverData,
  files: DriverUploadFiles = {},
): Promise<Driver> => {
  await validateTruckAssignment(driverData.truckId);
  await validateDriverUniqueness(driverData);
  // Since multer-storage-cloudinary uploads the file instantly, file.path contains the Cloudinary secure URL
  const profileImageUrl = files.profileImage ? files.profileImage.path : null;
  try {
    const driverId = await createDriverRepository({
      ...driverData,
      profileImage: profileImageUrl,
    });
    return getDriverById(driverId);
  } catch (error) {
    // If database insertion fails and an image was uploaded to Cloudinary, delete it
    if (profileImageUrl) {
      try {
        await deleteDriverProfileImage(0, profileImageUrl);
      } catch {
        // Ignore cleanup error on fail
      }
    }
    const duplicateField = getDuplicateDriverField(error);
    if (duplicateField === "name") {
      throw new AppError("Driver name already exists.", 409);
    }
    if (duplicateField === "email") {
      throw new AppError("Email already exists.", 409);
    }
    if (duplicateField === "licenseNumber") {
      throw new AppError("License Number already exists.", 409);
    }
    throw error;
  }
};
export const updateDriver = async (
  driverId: number,
  driverData: UpdateDriverData,
  files: DriverUploadFiles = {},
): Promise<Driver> => {
  const existingDriver = await findDriverById(driverId);
  if (!existingDriver) {
    throw new AppError("Driver not found.", 404);
  }
  await validateTruckAssignment(driverData.truckId);
  await validateDriverUniqueness(driverData, driverId);
  let newProfileImage = existingDriver.profileImage;
  if (files.profileImage) {
    newProfileImage = files.profileImage.path;
  }
  try {
    await updateDriverRepository(driverId, {
      ...driverData,
      profileImage: newProfileImage,
    });
    // If a new image was uploaded and there was an old one, delete the old image from Cloudinary
    if (
      files.profileImage &&
      existingDriver.profileImage &&
      existingDriver.profileImage !== newProfileImage
    ) {
      await deleteDriverProfileImage(driverId, existingDriver.profileImage);
    }
    return getDriverById(driverId);
  } catch (error) {
    const duplicateField = getDuplicateDriverField(error);
    if (duplicateField === "name") {
      throw new AppError("Driver name already exists.", 409);
    }
    if (duplicateField === "email") {
      throw new AppError("Email already exists.", 409);
    }
    if (duplicateField === "licenseNumber") {
      throw new AppError("License Number already exists.", 409);
    }
    throw error;
  }
};
export const removeDriver = async (driverId: number): Promise<void> => {
  const existingDriver = await findDriverById(driverId);
  if (!existingDriver) {
    throw new AppError("Driver not found.", 404);
  }
  // Delete profile image from Cloudinary if it exists
  if (existingDriver.profileImage) {
    await deleteDriverProfileImage(driverId, existingDriver.profileImage);
  }
  await deleteDriver(driverId);
};
