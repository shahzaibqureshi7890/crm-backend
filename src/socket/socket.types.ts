import type { Socket } from "socket.io";

export interface SocketUser {
  userId: number;
  email: string;
}

export interface AuthenticatedSocket extends Socket {
  data: {
    user?: SocketUser;
  };
}
