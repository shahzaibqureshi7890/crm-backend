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
  // Extract Cloudinary secure URLs directly from multer files
  const featuredImageUrl = files.featuredImage
    ? files.featuredImage.path
    : null;
  const truckId = await createTruckRepository({
    ...truckData,
    featuredImage: featuredImageUrl,
  });
  try {
    if (files.galleryImages && files.galleryImages.length > 0) {
      for (const file of files.galleryImages) {
        if (file.path) {
          await addGalleryImage(truckId, file.path);
        }
      }
    }
    return getTruckById(truckId);
  } catch (error) {
    // Cleanup uploaded images from Cloudinary if database operation fails
    if (featuredImageUrl) {
      try {
        await deleteTruckFeaturedImage(truckId, featuredImageUrl);
      } catch {}
    }
    const gallery = await findGalleryImagesByTruckId(truckId);
    for (const image of gallery) {
      try {
        await deleteTruckGalleryImage(truckId, image.imageName);
      } catch {}
    }
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
    ? files.featuredImage.path
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
      for (const file of files.galleryImages) {
        if (file.path) {
          await addGalleryImage(truckId, file.path);
        }
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
  // Delete featured image from Cloudinary if it exists
  if (existingTruck.featuredImage) {
    await deleteTruckFeaturedImage(truckId, existingTruck.featuredImage);
  }
  // Delete gallery images from Cloudinary if they exist
  const gallery = await findGalleryImagesByTruckId(truckId);
  for (const image of gallery) {
    await deleteTruckGalleryImage(truckId, image.imageName);
  }
  await deleteTruck(truckId);
};
export const createTruckGalleryImage = async (
  truckId: number,
  imageUrl: string,
): Promise<TruckWithGallery> => {
  const existingTruck = await findTruckById(truckId);
  if (!existingTruck) {
    throw new AppError("Truck not found.", 404);
  }
  const trimmedImageUrl = imageUrl.trim();
  if (!trimmedImageUrl) {
    throw new AppError("Image URL is required.", 400);
  }
  await addGalleryImage(truckId, trimmedImageUrl);
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
