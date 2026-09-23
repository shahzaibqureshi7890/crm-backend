export interface CreateTruckData {
  name: string;
  year: number;
  featuredImage: string | null;
}

export interface UpdateTruckData {
  name: string;
  year: number;
  featuredImage: string | null;
}

export interface Truck {
  id: number;
  name: string;
  year: number;
  featuredImage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TruckGalleryImage {
  id: number;
  truckId: number;
  imageName: string;
  createdAt: Date;
}

export interface TruckWithGallery extends Truck {
  gallery: TruckGalleryImage[];
}
