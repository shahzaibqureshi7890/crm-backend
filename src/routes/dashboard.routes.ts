import { Router } from "express";

import { getCounts } from "../controllers/dashboard.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router: Router = Router();

router.use(authMiddleware);

router.get("/counts", getCounts);

export default router;
