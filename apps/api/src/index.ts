import dotenv from "dotenv";
import { createServer } from "http";
import WebSocket from "ws";
import { app } from "./app";
import { handleWebSocket } from "./utils/realtime";
import { connectPrisma } from "./utils/prisma";

dotenv.config();

const PORT = Number(process.env.PORT || 4000);

async function main() {
  try {
    await connectPrisma();
  } catch (err) {
    console.error("[startup] Database connection failed — aborting server start.");
    console.error("[startup] Ensure DATABASE_URL is set and the Postgres instance is reachable.");
    process.exit(1);
  }

  const server = createServer(app);
  const wss = new WebSocket.Server({ server, path: "/realtime" });

  wss.on("connection", (socket: WebSocket) => handleWebSocket(socket, wss));

  server.listen(PORT, () => {
    console.log(`[startup] Ledger API listening on http://localhost:${PORT}`);
  });
}

main();
