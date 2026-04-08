import { Server as SocketIOServer } from "socket.io";

declare global {
  // Singleton Socket.io server instance attached by custom server.ts
   
  var _io: SocketIOServer | undefined;
}
