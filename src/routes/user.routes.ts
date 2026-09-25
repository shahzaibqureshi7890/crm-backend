import { Router } from "express";
import { getProfile, getUsers } from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
const router: Router = Router();
router.get("/profile", authMiddleware, getProfile);
router.get("/", authMiddleware, getUsers);
export default router;
