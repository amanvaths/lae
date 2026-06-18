import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
export declare function initSocket(httpServer: HttpServer): Server;
export declare function emitToUser(userId: string, event: string, payload: Record<string, unknown>): void;
export declare function getIO(): Server | null;
//# sourceMappingURL=index.d.ts.map