import { AppError } from "../errors/app.error.js";

import {
  addGalleryImage,
  deleteGalleryImage,
  deleteTruck,
  findAllTrucks,
  findGalleryImagesByTruckId,
  findTruckById,
  createTruck as createTruckRepository,
  updateTruck as updateTruckRepository,
} from "../repositories/truck.repository.js";

import type {
  CreateTruckData,
  TruckWithGallery,
  UpdateTruckData,
} from "../types/truck.types.js";

import {
  deleteTruckFeaturedImage,
  deleteTruckGalleryImage,
  deleteTruckUploadDirectory,
  saveTruckFeaturedImage,
  saveTruckGalleryImages,
} from "../utils/file-storage.js";

interface TruckUploadFiles {
  featuredImage?: Express.Multer.File;
  galleryImages?: Express.Multer.File[];
}

export const getAllTrucks = async (): Promise<TruckWithGallery[]> => {
  const trucks = await findAllTrucks();

  const trucksWithGallery = await Promise.all(
    trucks.map(async (truck) => {
      const gallery = await findGalleryImagesByTruckId(truck.id);

      return {
        ...truck,
        gallery,
      };
    }),
  );

  return trucksWithGallery;
};

export const getTruckById = async (
  truckId: number,
): Promise<TruckWithGallery> => {
  const truck = await findTruckById(truckId);

  if (!truck) {
    throw new AppError("Truck not found.", 404);
  }

  const gallery = await findGalleryImagesByTruckId(truckId);

  return {
    ...truck,
    gallery,
  };
};

export const createTruck = async (
  truckData: CreateTruckData,
  files: TruckUploadFiles = {},
): Promise<TruckWithGallery> => {
  const truckId = await createTruckRepository({
    ...truckData,
    featuredImage: null,
  });

  try {
    let featuredImageName: string | null = null;

    if (files.featuredImage) {
      featuredImageName = await saveTruckFeaturedImage(
        truckId,
        files.featuredImage,
      );
    }

    if (featuredImageName) {
      await updateTruckRepository(truckId, {
        ...truckData,
        featuredImage: featuredImageName,
      });
    } else {
      await updateTruckRepository(truckId, {
        ...truckData,
        featuredImage: null,
      });
    }

    if (files.galleryImages && files.galleryImages.length > 0) {
      const galleryImageNames = await saveTruckGalleryImages(
        truckId,
        files.galleryImages,
      );

      for (const imageName of galleryImageNames) {
        await addGalleryImage(truckId, imageName);
      }
    }

    return getTruckById(truckId);
  } catch (error) {
    await deleteTruckUploadDirectory(truckId);

    await deleteTruck(truckId);

    throw error;
  }
};

export const updateTruck = async (
  truckId: number,
  truckData: UpdateTruckData,
  files: TruckUploadFiles = {},
): Promise<TruckWithGallery> => {
  const existingTruck = await findTruckById(truckId);

  if (!existingTruck) {
    throw new AppError("Truck not found.", 404);
  }

  const newFeaturedImage = files.featuredImage
    ? await saveTruckFeaturedImage(truckId, files.featuredImage)
    : existingTruck.featuredImage;

  try {
    await updateTruckRepository(truckId, {
      ...truckData,
      featuredImage: newFeaturedImage,
    });

    if (
      files.featuredImage &&
      existingTruck.featuredImage &&
      existingTruck.featuredImage !== newFeaturedImage
    ) {
      await deleteTruckFeaturedImage(truckId, existingTruck.featuredImage);
    }

    if (files.galleryImages && files.galleryImages.length > 0) {
      const galleryImageNames = await saveTruckGalleryImages(
        truckId,
        files.galleryImages,
      );

      for (const imageName of galleryImageNames) {
        await addGalleryImage(truckId, imageName);
      }
    }

    return getTruckById(truckId);
  } catch (error) {
    throw error;
  }
};

export const removeTruck = async (truckId: number): Promise<void> => {
  const existingTruck = await findTruckById(truckId);

  if (!existingTruck) {
    throw new AppError("Truck not found.", 404);
  }

  await deleteTruck(truckId);

  await deleteTruckUploadDirectory(truckId);
};

export const createTruckGalleryImage = async (
  truckId: number,
  imageName: string,
): Promise<TruckWithGallery> => {
  const existingTruck = await findTruckById(truckId);

  if (!existingTruck) {
    throw new AppError("Truck not found.", 404);
  }

  const trimmedImageName = imageName.trim();

  if (!trimmedImageName) {
    throw new AppError("Image name is required.", 400);
  }

  await addGalleryImage(truckId, trimmedImageName);

  return getTruckById(truckId);
};

export const removeTruckGalleryImage = async (
  truckId: number,
  imageId: number,
): Promise<TruckWithGallery> => {
  const existingTruck = await findTruckById(truckId);

  if (!existingTruck) {
    throw new AppError("Truck not found.", 404);
  }

  const gallery = await findGalleryImagesByTruckId(truckId);

  const image = gallery.find((item) => item.id === imageId);

  if (!image) {
    throw new AppError("Gallery image not found.", 404);
  }

  await deleteTruckGalleryImage(truckId, image.imageName);

  await deleteGalleryImage(imageId);

  return getTruckById(truckId);
};
