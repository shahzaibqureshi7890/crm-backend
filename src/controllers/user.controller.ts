import type { RequestHandler } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { getAllUsers, getUserProfile } from "../services/user.service.js";
import { asyncHandler } from "../utils/async-handler.js";
export const getProfile: RequestHandler = asyncHandler(async (req, res) => {
  const authenticatedRequest = req as AuthenticatedRequest;
  if (!authenticatedRequest.user) {
    throw new Error("Authentication required.");
  }
  const user = await getUserProfile(authenticatedRequest.user.userId);
  // Yeh header add karein taake browser cache (304) na kare
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  res.status(200).json({
    success: true,
    message: "Profile fetched successfully.",
    user,
  });
});
export const getUsers: RequestHandler = asyncHandler(async (req, res) => {
  const authenticatedRequest = req as AuthenticatedRequest;
  if (!authenticatedRequest.user) {
    throw new Error("Authentication required.");
  }
  const users = await getAllUsers(authenticatedRequest.user.userId);
  res.status(200).json({
    success: true,
    message: "Users fetched successfully.",
    users,
  });
});
