import type { Request, RequestHandler, Response } from "express";

import { asyncHandler } from "../utils/async-handler.js";

import { getDashboardCounts } from "../services/dashboard.service.js";

export const getCounts: RequestHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    const counts = await getDashboardCounts();

    res.status(200).json({
      success: true,
      counts,
    });
  },
);
