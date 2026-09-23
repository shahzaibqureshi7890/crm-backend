import type { Request, RequestHandler, Response } from "express";

import { asyncHandler } from "../utils/async-handler.js";

import {
  createDriver,
  getAllDrivers,
  getDriverById,
  removeDriver,
  updateDriver,
} from "../services/driver.service.js";

import {
  validateCreateDriverInput,
  validateDriverId,
  validateUpdateDriverInput,
} from "../validators/driver.validator.js";

const getParamValue = (
  value: string | string[] | undefined,
  paramName: string,
): string => {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Invalid ${paramName}.`);
  }

  return value;
};

const getDriverUploadedFile = (
  req: Request,
): Express.Multer.File | undefined => {
  if (!req.file) {
    return undefined;
  }

  return req.file;
};

export const getDrivers: RequestHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    const drivers = await getAllDrivers();

    res.status(200).json({
      success: true,
      drivers,
    });
  },
);

export const getDriver: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const id = getParamValue(req.params.id, "driver ID");

    const driverId = validateDriverId(id);

    const driver = await getDriverById(driverId);

    res.status(200).json({
      success: true,
      driver,
    });
  },
);

export const create: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const driverData = validateCreateDriverInput(req.body);

    const profileImage = getDriverUploadedFile(req);

    const driver = profileImage
      ? await createDriver(driverData, {
          profileImage,
        })
      : await createDriver(driverData);

    res.status(201).json({
      success: true,
      message: "Driver created successfully.",
      driver,
    });
  },
);

export const update: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const id = getParamValue(req.params.id, "driver ID");

    const driverId = validateDriverId(id);

    const driverData = validateUpdateDriverInput(req.body);

    const profileImage = getDriverUploadedFile(req);

    const driver = profileImage
      ? await updateDriver(driverId, driverData, {
          profileImage,
        })
      : await updateDriver(driverId, driverData);

    res.status(200).json({
      success: true,
      message: "Driver updated successfully.",
      driver,
    });
  },
);

export const remove: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const id = getParamValue(req.params.id, "driver ID");

    const driverId = validateDriverId(id);

    await removeDriver(driverId);

    res.status(200).json({
      success: true,
      message: "Driver deleted successfully.",
    });
  },
);
