import type { Request, RequestHandler, Response } from "express";

import { asyncHandler } from "../utils/async-handler.js";

import {
  createTruck,
  createTruckGalleryImage,
  getAllTrucks,
  getTruckById,
  removeTruck,
  removeTruckGalleryImage,
  updateTruck,
} from "../services/truck.service.js";

import {
  validateCreateTruckInput,
  validateTruckId,
  validateUpdateTruckInput,
} from "../validators/truck.validator.js";

const getParamValue = (
  value: string | string[] | undefined,
  paramName: string,
): string => {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Invalid ${paramName}.`);
  }

  return value;
};

type TruckUploadedFiles = {
  featuredImage?: Express.Multer.File[];
  galleryImages?: Express.Multer.File[];
};

const getTruckUploadedFiles = (req: Request): TruckUploadedFiles => {
  if (!req.files || typeof req.files !== "object" || Array.isArray(req.files)) {
    return {};
  }

  return req.files as TruckUploadedFiles;
};

export const getTrucks: RequestHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    const trucks = await getAllTrucks();

    res.status(200).json({
      success: true,
      trucks,
    });
  },
);

export const getTruck: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const id = getParamValue(req.params.id, "truck ID");

    const truckId = validateTruckId(id);

    const truck = await getTruckById(truckId);

    res.status(200).json({
      success: true,
      truck,
    });
  },
);

export const create: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const truckData = validateCreateTruckInput(req.body);

    const files = getTruckUploadedFiles(req);

    const featuredImage = files.featuredImage?.[0];
    const galleryImages = files.galleryImages ?? [];

    const truck = featuredImage
      ? await createTruck(truckData, {
          featuredImage,
          galleryImages,
        })
      : await createTruck(truckData, {
          galleryImages,
        });

    res.status(201).json({
      success: true,
      message: "Truck created successfully.",
      truck,
    });
  },
);

export const update: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const id = getParamValue(req.params.id, "truck ID");

    const truckId = validateTruckId(id);

    const truckData = validateUpdateTruckInput(req.body);

    const files = getTruckUploadedFiles(req);

    const featuredImage = files.featuredImage?.[0];
    const galleryImages = files.galleryImages ?? [];

    const truck = featuredImage
      ? await updateTruck(truckId, truckData, {
          featuredImage,
          galleryImages,
        })
      : await updateTruck(truckId, truckData, {
          galleryImages,
        });

    res.status(200).json({
      success: true,
      message: "Truck updated successfully.",
      truck,
    });
  },
);

export const remove: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const id = getParamValue(req.params.id, "truck ID");

    const truckId = validateTruckId(id);

    await removeTruck(truckId);

    res.status(200).json({
      success: true,
      message: "Truck deleted successfully.",
    });
  },
);

export const addGalleryImage: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const id = getParamValue(req.params.id, "truck ID");

    const truckId = validateTruckId(id);

    const files = getTruckUploadedFiles(req);

    const galleryImage = files.galleryImages?.[0];

    if (!galleryImage) {
      throw new Error("Gallery image is required.");
    }

    const truck = await createTruckGalleryImage(
      truckId,
      galleryImage.originalname,
    );

    res.status(201).json({
      success: true,
      message: "Gallery image added successfully.",
      truck,
    });
  },
);

export const removeGalleryImage: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const id = getParamValue(req.params.id, "truck ID");

    const imageIdParam = getParamValue(req.params.imageId, "gallery image ID");

    const truckId = validateTruckId(id);
    const imageId = validateTruckId(imageIdParam);

    const truck = await removeTruckGalleryImage(truckId, imageId);

    res.status(200).json({
      success: true,
      message: "Gallery image deleted successfully.",
      truck,
    });
  },
);
