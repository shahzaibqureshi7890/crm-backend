import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { createServer } from "node:http";
import { Server } from "socket.io";
import pool from "./config/database.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import truckRoutes from "./routes/truck.routes.js";
import driverRoutes from "./routes/driver.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { socketAuthMiddleware } from "./socket/socket-auth.middleware.js";
import { setSocketIO } from "./socket/socket.io.js";
import {
  addUserSocket,
  removeUserSocket,
  getOnlineUserIds,
} from "./socket/presence.js";
import { registerChatSocket } from "./socket/chat.socket.js";
dotenv.config();
const app = express();
const PORT = Number(process.env.PORT) || 5000;
// Render/Vercel Proxy Settings (Required for HTTPS Cookie Auth)
app.set("trust proxy", 1);
// Foolproof Self-Healing Uploads Directory Setup
let uploadsDir: string;
try {
  const localUploads = path.resolve(process.cwd(), "uploads");
  if (!fs.existsSync(localUploads)) {
    fs.mkdirSync(localUploads, { recursive: true });
  }
  uploadsDir = localUploads;
} catch (error) {
  // Fallback to os.tmpdir() if process.cwd() is read-only (Serverless / Vercel)
  uploadsDir = path.join(os.tmpdir(), "uploads");
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  } catch (tmpError) {
    console.error("Failed to create temp uploads directory:", tmpError);
  }
}
// Clean and validate Allowed Origins
const rawFrontendUrl = process.env.FRONTEND_URL || "";
const cleanFrontendUrl = rawFrontendUrl.replace(/\/$/, "");
const allowedOrigins = [
  cleanFrontendUrl,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].filter(Boolean);
const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return true;
  const cleanOrigin = origin.replace(/\/$/, "");
  return (
    allowedOrigins.includes(cleanOrigin) || cleanOrigin.endsWith(".vercel.app")
  );
};
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};
app.use(cors(corsOptions));
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  },
  transports: ["websocket", "polling"],
});
setSocketIO(io);
io.use(socketAuthMiddleware);
io.on("connection", (socket) => {
  const user = socket.data.user;
  if (!user) {
    socket.disconnect();
    return;
  }
  const userId = user.userId;
  const wasOffline = addUserSocket(userId, socket.id);
  console.log(`Socket connected: user ${userId}`);
  if (wasOffline) {
    io.emit("user_online", { userId });
  }
  socket.emit("online_users", {
    userIds: getOnlineUserIds(),
  });
  registerChatSocket(io, socket);
  socket.on("disconnect", () => {
    const isNowOffline = removeUserSocket(userId, socket.id);
    console.log(`Socket disconnected: user ${userId}`);
    if (isNowOffline) {
      io.emit("user_offline", { userId });
    }
  });
});
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(uploadsDir));
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "CRM Backend API is running",
  });
});
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/trucks", truckRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use(errorMiddleware);
const startServer = async () => {
  try {
    await pool.query("SELECT 1");
    console.log("MySQL database connected successfully.");
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("MySQL database connection failed:", error);
    process.exit(1);
  }
};
startServer();
