import { AppError } from "../errors/app.error.js";

import type {
  CreateDriverData,
  DriverStatus,
  UpdateDriverData,
} from "../types/driver.types.js";

const getRequiredString = (value: unknown, fieldName: string): string => {
  if (typeof value !== "string" || value.trim() === "") {
    throw new AppError(`${fieldName} is required.`, 400);
  }

  return value.trim();
};

const getOptionalString = (
  value: unknown,
  fieldName: string,
): string | null => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new AppError(`${fieldName} must be a valid string.`, 400);
  }

  const trimmedValue = value.trim();

  return trimmedValue === "" ? null : trimmedValue;
};

const getOptionalEmail = (value: unknown): string | null => {
  const email = getOptionalString(value, "Email");

  if (email === null) {
    return null;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    throw new AppError("Email must be valid.", 400);
  }

  return email.toLowerCase();
};

const getOptionalTruckId = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const truckId =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;

  if (!Number.isInteger(truckId) || truckId <= 0) {
    throw new AppError("Assigned truck ID must be valid.", 400);
  }

  return truckId;
};

const getRequiredPhone = (value: unknown): string => {
  const phone = getRequiredString(value, "Phone");

  if (phone.length < 7 || phone.length > 30) {
    throw new AppError("Phone must be between 7 and 30 characters.", 400);
  }

  return phone;
};

const getRequiredLicenseNumber = (value: unknown): string => {
  const licenseNumber = getRequiredString(value, "License number");

  if (licenseNumber.length > 100) {
    throw new AppError("License number must not exceed 100 characters.", 400);
  }

  return licenseNumber;
};

const getOptionalLicenseExpiry = (value: unknown): string | null => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new AppError("License expiry must be a valid date.", 400);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new AppError("License expiry must be a valid date.", 400);
  }

  /*
   * MySQL DATE expects YYYY-MM-DD.
   * We validate that the provided value has
   * a valid date representation.
   */
  const normalizedDate = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
    throw new AppError("License expiry must use YYYY-MM-DD format.", 400);
  }

  return normalizedDate;
};

const getValidDriverStatus = (value: unknown): DriverStatus => {
  const validStatuses: DriverStatus[] = ["active", "inactive", "on_leave"];

  if (
    typeof value !== "string" ||
    !validStatuses.includes(value as DriverStatus)
  ) {
    throw new AppError("Status must be active, inactive, or on_leave.", 400);
  }

  return value as DriverStatus;
};

const getOptionalProfileImageName = (value: unknown): string | null => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new AppError("Profile image must be a valid filename.", 400);
  }

  const imageName = value.trim();

  return imageName === "" ? null : imageName;
};

const validateDriverInput = (input: unknown): CreateDriverData => {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new AppError("Invalid driver data.", 400);
  }

  const data = input as Record<string, unknown>;

  return {
    truckId: getOptionalTruckId(data.truckId),

    name: getRequiredString(data.name, "Name"),
    email: getOptionalEmail(data.email),
    phone: getRequiredPhone(data.phone),

    licenseNumber: getRequiredLicenseNumber(data.licenseNumber),
    licenseExpiry: getOptionalLicenseExpiry(data.licenseExpiry),

    status: getValidDriverStatus(data.status),

    profileImage: getOptionalProfileImageName(data.profileImage),
  };
};

export const validateCreateDriverInput = (input: unknown): CreateDriverData => {
  return validateDriverInput(input);
};

export const validateUpdateDriverInput = (input: unknown): UpdateDriverData => {
  return validateDriverInput(input);
};

export const validateDriverId = (value: string): number => {
  const driverId = Number(value);

  if (!Number.isInteger(driverId) || driverId <= 0) {
    throw new AppError("Invalid driver ID.", 400);
  }

  return driverId;
};
