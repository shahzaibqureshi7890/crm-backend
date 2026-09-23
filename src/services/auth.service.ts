import bcrypt from "bcryptjs";

import {
  createUser,
  findUserByEmail,
} from "../repositories/user.repository.js";

import { generateAccessToken } from "../utils/jwt.js";
import { AppError } from "../errors/app.error.js";

import type {
  LoginRequestBody,
  RegisterRequestBody,
} from "../types/auth.types.js";

export const registerUser = async (userData: RegisterRequestBody) => {
  const existingUser = await findUserByEmail(userData.email);

  if (existingUser) {
    throw new AppError("Email is already registered.", 409);
  }

  const hashedPassword = await bcrypt.hash(userData.password, 12);

  const userId = await createUser({
    name: userData.name,
    email: userData.email,
    password: hashedPassword,
  });

  const token = generateAccessToken(userId, userData.email);

  return {
    user: {
      id: userId,
      name: userData.name,
      email: userData.email,
    },
    token,
  };
};

export const loginUser = async (loginData: LoginRequestBody) => {
  const user = await findUserByEmail(loginData.email);

  if (!user) {
    throw new AppError("Invalid email or password.", 401);
  }

  const passwordMatches = await bcrypt.compare(
    loginData.password,
    user.password,
  );

  if (!passwordMatches) {
    throw new AppError("Invalid email or password.", 401);
  }

  const token = generateAccessToken(user.id, user.email);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    token,
  };
};
