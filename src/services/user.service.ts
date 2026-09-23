import { findAllUsers, findUserById } from "../repositories/user.repository.js";
import { AppError } from "../errors/app.error.js";
export const getUserProfile = async (userId: number) => {
  const user = await findUserById(userId);
  if (!user) {
    throw new AppError("User not found.", 404);
  }
  return user;
};
export const getAllUsers = async (currentUserId: number) => {
  return findAllUsers(currentUserId);
};
