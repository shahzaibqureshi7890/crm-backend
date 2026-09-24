import type { Request, Response, RequestHandler } from "express";
import { loginUser, registerUser } from "../services/auth.service.js";
import {
  validateLoginInput,
  validateRegisterInput,
} from "../validators/auth.validator.js";
import { asyncHandler } from "../utils/async-handler.js";
const isProduction = process.env.NODE_ENV === "production";
const setAuthCookie = (res: Response, token: string): void => {
  res.cookie("accessToken", token, {
    httpOnly: true,
    // Cross-domain (Vercel -> Vercel/Render) cookie support ke liye:
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    partitioned: isProduction, // Modern browsers ki cross-site third-party cookie policy ke liye zaroori hai
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: "/",
  });
};
export const register: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userData = validateRegisterInput(req.body);
    const result = await registerUser(userData);
    setAuthCookie(res, result.token);
    res.status(201).json({
      success: true,
      message: "Registration successful.",
      user: result.user,
    });
  },
);
export const login: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const loginData = validateLoginInput(req.body);
    const result = await loginUser(loginData);
    setAuthCookie(res, result.token);
    res.status(200).json({
      success: true,
      message: "Login successful.",
      user: result.user,
    });
  },
);
export const logout: RequestHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      partitioned: isProduction,
      path: "/",
    });
    res.status(200).json({
      success: true,
      message: "Logout successful.",
    });
  },
);
