// Socket.io server singleton — accessed by API routes to emit events
import { Server as SocketIOServer } from "socket.io";

export function getIO(): SocketIOServer | undefined {
  return global._io;
}

export function emitToSession(
  sessionId: string,
  event: string,
  data: unknown
) {
  const io = getIO();
  if (!io) {
    console.warn("[SOCKET] io not initialized, cannot emit:", event);
    return;
  }
  io.to(`session:${sessionId}`).emit(event, data);
}
