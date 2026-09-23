import { Router } from "express";

import {
  addGalleryImage,
  create,
  getTruck,
  getTrucks,
  remove,
  removeGalleryImage,
  update,
} from "../controllers/truck.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { uploadImages } from "../middlewares/upload.middleware.js";

const router: Router = Router();

router.use(authMiddleware);

// Trucks CRUD
router.get("/", getTrucks);

router.get("/:id", getTruck);

router.post(
  "/",
  uploadImages.fields([
    {
      name: "featuredImage",
      maxCount: 1,
    },
    {
      name: "galleryImages",
      maxCount: 10,
    },
  ]),
  create,
);

router.put(
  "/:id",
  uploadImages.fields([
    {
      name: "featuredImage",
      maxCount: 1,
    },
    {
      name: "galleryImages",
      maxCount: 10,
    },
  ]),
  update,
);

router.delete("/:id", remove);

// Truck gallery
router.post(
  "/:id/gallery",
  uploadImages.fields([
    {
      name: "galleryImages",
      maxCount: 1,
    },
  ]),
  addGalleryImage,
);

router.delete("/:id/gallery/:imageId", removeGalleryImage);

export default router;
