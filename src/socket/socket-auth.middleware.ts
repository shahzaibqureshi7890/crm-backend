import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/jwt.js";
import type { AuthenticatedSocket } from "./socket.types.js";
export const socketAuthMiddleware = (
  socket: AuthenticatedSocket,
  next: (err?: Error) => void,
): void => {
  let token: string | undefined;
  // 1. Check token in Socket Auth object (Best practice for cross-domain WebSockets)
  if (
    socket.handshake.auth &&
    typeof socket.handshake.auth.token === "string"
  ) {
    token = socket.handshake.auth.token;
  }
  // 2. Fallback: Check Authorization Bearer header
  if (!token && socket.handshake.headers.authorization) {
    const authHeader = socket.handshake.headers.authorization;
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }
  // 3. Fallback: Extract from HTTP handshake cookies
  if (!token && socket.handshake.headers.cookie) {
    token = socket.handshake.headers.cookie
      .split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith("accessToken="))
      ?.split("=")
      .slice(1)
      .join("=");
  }
  if (!token) {
    next(new Error("Authentication required."));
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (
      typeof decoded !== "object" ||
      decoded === null ||
      typeof decoded.userId !== "number" ||
      typeof decoded.email !== "string"
    ) {
      next(new Error("Invalid authentication token."));
      return;
    }
    socket.data.user = {
      userId: decoded.userId,
      email: decoded.email,
    };
    next();
  } catch {
    next(new Error("Invalid or expired token."));
  }
};
