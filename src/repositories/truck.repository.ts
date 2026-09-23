import { RowDataPacket, ResultSetHeader } from "mysql2";

import pool from "../config/database.js";

import type {
  CreateTruckData,
  Truck,
  TruckGalleryImage,
  UpdateTruckData,
} from "../types/truck.types.js";

interface TruckRow extends RowDataPacket {
  id: number;
  name: string;
  year: number;
  featured_image: string | null;
  created_at: Date;
  updated_at: Date;
}

interface GalleryImageRow extends RowDataPacket {
  id: number;
  truck_id: number;
  image_name: string;
  created_at: Date;
}

const mapTruckRow = (row: TruckRow): Truck => ({
  id: row.id,
  name: row.name,
  year: row.year,
  featuredImage: row.featured_image,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapGalleryImageRow = (row: GalleryImageRow): TruckGalleryImage => ({
  id: row.id,
  truckId: row.truck_id,
  imageName: row.image_name,
  createdAt: row.created_at,
});

export const findAllTrucks = async (): Promise<Truck[]> => {
  const [rows] = await pool.query<TruckRow[]>(
    `
      SELECT
        id,
        name,
        year,
        featured_image,
        created_at,
        updated_at
      FROM trucks
      ORDER BY id DESC
    `,
  );

  return rows.map(mapTruckRow);
};

export const findTruckById = async (truckId: number): Promise<Truck | null> => {
  const [rows] = await pool.query<TruckRow[]>(
    `
      SELECT
        id,
        name,
        year,
        featured_image,
        created_at,
        updated_at
      FROM trucks
      WHERE id = ?
      LIMIT 1
    `,
    [truckId],
  );

  const truck = rows[0];

  if (!truck) {
    return null;
  }

  return mapTruckRow(truck);
};

export const createTruck = async (
  truckData: CreateTruckData,
): Promise<number> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `
      INSERT INTO trucks (
        name,
        year,
        featured_image
      )
      VALUES (?, ?, ?)
    `,
    [truckData.name, truckData.year, truckData.featuredImage],
  );

  return result.insertId;
};

export const updateTruck = async (
  truckId: number,
  truckData: UpdateTruckData,
): Promise<void> => {
  await pool.execute(
    `
      UPDATE trucks
      SET
        name = ?,
        year = ?,
        featured_image = ?
      WHERE id = ?
    `,
    [truckData.name, truckData.year, truckData.featuredImage, truckId],
  );
};

export const deleteTruck = async (truckId: number): Promise<void> => {
  await pool.execute(
    `
      DELETE FROM trucks
      WHERE id = ?
    `,
    [truckId],
  );
};

export const findGalleryImagesByTruckId = async (
  truckId: number,
): Promise<TruckGalleryImage[]> => {
  const [rows] = await pool.query<GalleryImageRow[]>(
    `
      SELECT
        id,
        truck_id,
        image_name,
        created_at
      FROM truck_gallery_images
      WHERE truck_id = ?
      ORDER BY id ASC
    `,
    [truckId],
  );

  return rows.map(mapGalleryImageRow);
};

export const addGalleryImage = async (
  truckId: number,
  imageName: string,
): Promise<number> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `
      INSERT INTO truck_gallery_images (
        truck_id,
        image_name
      )
      VALUES (?, ?)
    `,
    [truckId, imageName],
  );

  return result.insertId;
};

export const deleteGalleryImage = async (imageId: number): Promise<void> => {
  await pool.execute(
    `
      DELETE FROM truck_gallery_images
      WHERE id = ?
    `,
    [imageId],
  );
};
