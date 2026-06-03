import dotenv from "dotenv";
import { createServer } from "http";
import WebSocket from "ws";
import { app } from "./app";
import { handleWebSocket } from "./utils/realtime";

dotenv.config();

const PORT = Number(process.env.PORT || 4000);
const server = createServer(app);
const wss = new WebSocket.Server({ server, path: "/realtime" });

wss.on("connection", (socket: WebSocket) => handleWebSocket(socket, wss));

server.listen(PORT, () => {
  console.log(`Ledger API listening on http://localhost:${PORT}`);
});
