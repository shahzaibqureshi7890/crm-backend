import { AppError } from "../errors/app.error.js";

import type { CreateTruckData, UpdateTruckData } from "../types/truck.types.js";

const getRequiredString = (value: unknown, fieldName: string): string => {
  if (typeof value !== "string" || value.trim() === "") {
    throw new AppError(`${fieldName} is required.`, 400);
  }

  return value.trim();
};

const getValidYear = (value: unknown): number => {
  const year =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;

  if (!Number.isInteger(year)) {
    throw new AppError("Year must be a valid number.", 400);
  }

  const currentYear = new Date().getFullYear();

  if (year < 1900 || year > currentYear + 1) {
    throw new AppError(
      `Year must be between 1900 and ${currentYear + 1}.`,
      400,
    );
  }

  return year;
};

const getOptionalImageName = (value: unknown): string | null => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new AppError("Featured image must be a valid filename.", 400);
  }

  const imageName = value.trim();

  if (imageName === "") {
    return null;
  }

  return imageName;
};

export const validateCreateTruckInput = (input: unknown): CreateTruckData => {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new AppError("Invalid truck data.", 400);
  }

  const data = input as Record<string, unknown>;

  return {
    name: getRequiredString(data.name, "Name"),
    year: getValidYear(data.year),
    featuredImage: getOptionalImageName(data.featuredImage),
  };
};

export const validateUpdateTruckInput = (input: unknown): UpdateTruckData => {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new AppError("Invalid truck data.", 400);
  }

  const data = input as Record<string, unknown>;

  return {
    name: getRequiredString(data.name, "Name"),
    year: getValidYear(data.year),
    featuredImage: getOptionalImageName(data.featuredImage),
  };
};

export const validateTruckId = (value: string): number => {
  const truckId = Number(value);

  if (!Number.isInteger(truckId) || truckId <= 0) {
    throw new AppError("Invalid truck ID.", 400);
  }

  return truckId;
};
