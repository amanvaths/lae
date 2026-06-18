import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { config } from "../config/index.js";

let io: Server | null = null;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: config.corsOrigin, credentials: true },
    path: "/socket.io",
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.auth?.userId as string | undefined;
    if (userId) {
      socket.join(`user:${userId}`);
    }

    socket.on("subscribe", (uid: string) => {
      socket.join(`user:${uid}`);
    });

    socket.on("disconnect", () => {});
  });

  return io;
}

export function emitToUser(
  userId: string,
  event: string,
  payload: Record<string, unknown>
): void {
  io?.to(`user:${userId}`).emit(event, payload);
}

export function getIO(): Server | null {
  return io;
}
