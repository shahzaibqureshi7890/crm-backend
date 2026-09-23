import type { Server } from "socket.io";
let io: Server | null = null;
export const setSocketIO = (server: Server): void => {
  io = server;
};
export const getSocketIO = (): Server => {
  if (!io) {
    throw new Error("Socket.IO server is not initialized.");
  }
  return io;
};
export const getUserRoom = (userId: number): string => {
  return `user:${userId}`;
};
export const emitToUser = (
  userId: number,
  event: string,
  payload: unknown,
): void => {
  getSocketIO().to(getUserRoom(userId)).emit(event, payload);
};
