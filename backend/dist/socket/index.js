import { Server } from "socket.io";
import { config } from "../config/index.js";
let io = null;
export function initSocket(httpServer) {
    io = new Server(httpServer, {
        cors: { origin: config.corsOrigin, credentials: true },
        path: "/socket.io",
    });
    io.on("connection", (socket) => {
        const userId = socket.handshake.auth?.userId;
        if (userId) {
            socket.join(`user:${userId}`);
        }
        socket.on("subscribe", (uid) => {
            socket.join(`user:${uid}`);
        });
        socket.on("disconnect", () => { });
    });
    return io;
}
export function emitToUser(userId, event, payload) {
    io?.to(`user:${userId}`).emit(event, payload);
}
export function getIO() {
    return io;
}
//# sourceMappingURL=index.js.map