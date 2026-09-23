import { ResultSetHeader, RowDataPacket } from "mysql2";

import pool from "../config/database.js";

import type {
  CreateDriverData,
  Driver,
  UpdateDriverData,
} from "../types/driver.types.js";

interface DriverRow extends RowDataPacket {
  id: number;
  truck_id: number | null;
  name: string;
  email: string | null;
  phone: string;
  license_number: string;
  license_expiry: Date | string | null;
  status: Driver["status"];
  profile_image: string | null;
  created_at: Date;
  updated_at: Date;
}

const mapDriverRow = (row: DriverRow): Driver => ({
  id: row.id,
  truckId: row.truck_id,
  name: row.name,
  email: row.email,
  phone: row.phone,
  licenseNumber: row.license_number,
  licenseExpiry: row.license_expiry,
  status: row.status,
  profileImage: row.profile_image,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const findAllDrivers = async (): Promise<Driver[]> => {
  const [rows] = await pool.query<DriverRow[]>(
    `
      SELECT
        id,
        truck_id,
        name,
        email,
        phone,
        license_number,
        license_expiry,
        status,
        profile_image,
        created_at,
        updated_at
      FROM drivers
      ORDER BY id DESC
    `,
  );

  return rows.map(mapDriverRow);
};

export const findDriverById = async (
  driverId: number,
): Promise<Driver | null> => {
  const [rows] = await pool.query<DriverRow[]>(
    `
      SELECT
        id,
        truck_id,
        name,
        email,
        phone,
        license_number,
        license_expiry,
        status,
        profile_image,
        created_at,
        updated_at
      FROM drivers
      WHERE id = ?
      LIMIT 1
    `,
    [driverId],
  );

  const driver = rows[0];

  if (!driver) {
    return null;
  }

  return mapDriverRow(driver);
};

export const findDriverByName = async (
  name: string,
): Promise<Driver | null> => {
  const [rows] = await pool.query<DriverRow[]>(
    `
      SELECT
        id,
        truck_id,
        name,
        email,
        phone,
        license_number,
        license_expiry,
        status,
        profile_image,
        created_at,
        updated_at
      FROM drivers
      WHERE name = ?
      LIMIT 1
    `,
    [name],
  );

  const driver = rows[0];

  if (!driver) {
    return null;
  }

  return mapDriverRow(driver);
};

export const findDriverByEmail = async (
  email: string,
): Promise<Driver | null> => {
  const [rows] = await pool.query<DriverRow[]>(
    `
      SELECT
        id,
        truck_id,
        name,
        email,
        phone,
        license_number,
        license_expiry,
        status,
        profile_image,
        created_at,
        updated_at
      FROM drivers
      WHERE email = ?
      LIMIT 1
    `,
    [email],
  );

  const driver = rows[0];

  if (!driver) {
    return null;
  }

  return mapDriverRow(driver);
};

export const findDriverByLicenseNumber = async (
  licenseNumber: string,
): Promise<Driver | null> => {
  const [rows] = await pool.query<DriverRow[]>(
    `
      SELECT
        id,
        truck_id,
        name,
        email,
        phone,
        license_number,
        license_expiry,
        status,
        profile_image,
        created_at,
        updated_at
      FROM drivers
      WHERE license_number = ?
      LIMIT 1
    `,
    [licenseNumber],
  );

  const driver = rows[0];

  if (!driver) {
    return null;
  }

  return mapDriverRow(driver);
};

export const createDriver = async (
  driverData: CreateDriverData,
): Promise<number> => {
  const [result] = await pool.execute<ResultSetHeader>(
    `
      INSERT INTO drivers (
        truck_id,
        name,
        email,
        phone,
        license_number,
        license_expiry,
        status,
        profile_image
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      driverData.truckId,
      driverData.name,
      driverData.email,
      driverData.phone,
      driverData.licenseNumber,
      driverData.licenseExpiry,
      driverData.status,
      driverData.profileImage,
    ],
  );

  return result.insertId;
};

export const updateDriver = async (
  driverId: number,
  driverData: UpdateDriverData,
): Promise<void> => {
  await pool.execute(
    `
      UPDATE drivers
      SET
        truck_id = ?,
        name = ?,
        email = ?,
        phone = ?,
        license_number = ?,
        license_expiry = ?,
        status = ?,
        profile_image = ?
      WHERE id = ?
    `,
    [
      driverData.truckId,
      driverData.name,
      driverData.email,
      driverData.phone,
      driverData.licenseNumber,
      driverData.licenseExpiry,
      driverData.status,
      driverData.profileImage,
      driverId,
    ],
  );
};

export const deleteDriver = async (driverId: number): Promise<void> => {
  await pool.execute(
    `
      DELETE FROM drivers
      WHERE id = ?
    `,
    [driverId],
  );
};
