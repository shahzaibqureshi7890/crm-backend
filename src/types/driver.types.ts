export type DriverStatus = "active" | "inactive" | "on_leave";

export interface Driver {
  id: number;
  truckId: number | null;

  name: string;
  email: string | null;
  phone: string;

  licenseNumber: string;
  licenseExpiry: Date | string | null;

  status: DriverStatus;

  profileImage: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDriverData {
  truckId: number | null;

  name: string;
  email: string | null;
  phone: string;

  licenseNumber: string;
  licenseExpiry: string | null;

  status: DriverStatus;

  profileImage: string | null;
}

export interface UpdateDriverData {
  truckId: number | null;

  name: string;
  email: string | null;
  phone: string;

  licenseNumber: string;
  licenseExpiry: string | null;

  status: DriverStatus;

  profileImage: string | null;
}
