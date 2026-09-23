import type {
  LoginRequestBody,
  RegisterRequestBody,
} from "../types/auth.types.js";
import { AppError } from "../errors/app.error.js";

const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validateRegisterInput = (input: unknown): RegisterRequestBody => {
  if (!input || typeof input !== "object") {
    throw new AppError("Request body is required.", 400);
  }

  const { name, email, password } = input as Record<string, unknown>;

  if (typeof name !== "string" || name.trim().length < 2) {
    throw new AppError("Name must be at least 2 characters long.", 400);
  }

  if (typeof email !== "string" || !isValidEmail(email)) {
    throw new AppError("Please provide a valid email address.", 400);
  }

  if (typeof password !== "string" || password.length < 8) {
    throw new AppError("Password must be at least 8 characters long.", 400);
  }

  return {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
  };
};

export const validateLoginInput = (input: unknown): LoginRequestBody => {
  if (!input || typeof input !== "object") {
    throw new AppError("Request body is required.", 400);
  }

  const { email, password } = input as Record<string, unknown>;

  if (typeof email !== "string" || !isValidEmail(email)) {
    throw new AppError("Please provide a valid email address.", 400);
  }

  if (typeof password !== "string" || password.length === 0) {
    throw new AppError("Password is required.", 400);
  }

  return {
    email: email.trim().toLowerCase(),
    password,
  };
};
