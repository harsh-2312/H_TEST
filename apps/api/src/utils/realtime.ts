import WebSocket, { type RawData, type Server } from "ws";

export function handleWebSocket(socket: WebSocket, server: Server) {
  socket.on("message", (message: RawData) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === "PING") {
        socket.send(JSON.stringify({ type: "PONG", timestamp: Date.now() }));
      }
    } catch (error) {
      socket.send(JSON.stringify({ type: "ERROR", message: "Invalid payload" }));
    }
  });

  socket.on("close", () => {
    // no-op cleanup
  });
}

export function broadcastUpdate(server: Server, event: string, payload: any) {
  const message = JSON.stringify({ type: event, payload });
  server.clients.forEach((client: WebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
