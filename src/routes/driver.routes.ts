import { Router } from "express";

import {
  create,
  getDriver,
  getDrivers,
  remove,
  update,
} from "../controllers/driver.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { uploadImages } from "../middlewares/upload.middleware.js";

const router: Router = Router();

router.use(authMiddleware);

// Drivers CRUD
router.get("/", getDrivers);

router.get("/:id", getDriver);

router.post("/", uploadImages.single("profileImage"), create);

router.put("/:id", uploadImages.single("profileImage"), update);

router.delete("/:id", remove);

export default router;
