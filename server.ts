// Custom Next.js server with Socket.io for real-time attendance events
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
const prisma = new PrismaClient();

// Store io globally so API routes can access it
declare global {
  // eslint-disable-next-line no-var
  var _io: SocketIOServer | undefined;
}

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    path: "/api/socket",
  });

  // Make io available to API routes
  global._io = io;

  io.on("connection", (socket) => {
    console.log(`[SOCKET] Client connected: ${socket.id}`);

    socket.on("join:session", (sessionId: string) => {
      socket.join(`session:${sessionId}`);
      console.log(`[SOCKET] ${socket.id} joined room session:${sessionId}`);
    });

    socket.on("disconnect", () => {
      console.log(`[SOCKET] Client disconnected: ${socket.id}`);
    });
  });

  // ── QR Auto-Rotation every 15 seconds ──
  setInterval(async () => {
    try {
      const activeSessions = await prisma.attendanceSession.findMany({
        where: { status: "ACTIVE" },
        select: { id: true },
      });

      for (const session of activeSessions) {
        const newToken = uuidv4();
        const newExpiry = new Date(Date.now() + 15 * 1000);

        await prisma.attendanceSession.update({
          where: { id: session.id },
          data: { qrCode: newToken, qrExpiry: newExpiry },
        });

        console.log(`[ROTATE] QR rotated for session ${session.id}: token=${newToken.slice(0, 8)}...`);

        io.to(`session:${session.id}`).emit("qr:rotated", {
          sessionId: session.id,
          token: newToken,
          expiresAt: newExpiry.toISOString(),
        });
      }
    } catch (err) {
      console.error("[ROTATE] Error rotating QR codes:", err);
    }
  }, 15000);

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.io attached on /api/socket`);
    console.log(`> QR auto-rotation: every 15 seconds`);
  });
});
