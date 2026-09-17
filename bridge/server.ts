/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import type { Response } from "express";
import path from "node:path";
import type { BridgeStatus, Message } from "../src/innsaeiCommunication/types";
import { Library } from "./library";
import { MockProvider } from "./providers/mock";
import type { Provider } from "./providers/types";
import { WhatsAppWebProvider } from "./providers/whatsappWeb";

/**
 * Innsaei Communication bridge: captures a WhatsApp account into a local
 * library and serves it to the Resolume panel over HTTP + SSE.
 *
 *   npm run bridge                              # mock data
 *   INNSAEI_PROVIDER=whatsapp-web npm run bridge # real account
 */

const PORT = Number(process.env.INNSAEI_BRIDGE_PORT ?? 7455);
const HOST = process.env.INNSAEI_BRIDGE_HOST ?? "127.0.0.1";
const PUBLIC_BASE = process.env.INNSAEI_BRIDGE_PUBLIC_BASE ?? `http://${HOST}:${PORT}`;
const LIBRARY_ROOT = process.env.INNSAEI_LIBRARY ?? path.resolve("library");

const library = new Library(LIBRARY_ROOT);
const provider: Provider =
  process.env.INNSAEI_PROVIDER === "whatsapp-web" ? new WhatsAppWebProvider() : new MockProvider();

const clients = new Set<Response>();

function broadcast(type: string, payload: unknown): void {
  const frame = `data: ${JSON.stringify({ type, payload })}\n\n`;
  for (const client of clients) client.write(frame);
}

const app = express();
app.use(express.json({ limit: "1mb" }));

// The panel runs from the Vite dev server (or Arena's web view), so it is a
// different origin from this loopback bridge.
app.use((_request, response, next) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  next();
});
app.options("*", (_request, response) => response.sendStatus(204));

app.get("/api/snapshot", (_request, response) => {
  response.json({ status: provider.status(), chats: library.listChats() });
});

app.get("/api/chats/:chatId/messages", (request, response) => {
  library.markRead(request.params.chatId);
  response.json(library.listMessages(request.params.chatId));
});

app.get("/api/chats/:chatId/assets", (request, response) => {
  response.json(library.listAssets(request.params.chatId));
});

app.post("/api/chats/:chatId/reply", async (request, response) => {
  const body = String((request.body as { body?: unknown })?.body ?? "").trim();
  if (!body) {
    response.status(400).json({ error: "body is required" });
    return;
  }
  try {
    response.json(await provider.reply(request.params.chatId, body));
  } catch (error) {
    response.status(502).json({ error: String(error) });
  }
});

app.get("/api/events", (_request, response) => {
  response.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });
  response.write(`data: ${JSON.stringify({ type: "status", payload: provider.status() })}\n\n`);
  clients.add(response);
  response.on("close", () => clients.delete(response));
});

// Captured files, also readable straight off disk as a Resolume source folder.
app.use("/media", express.static(library.root, { fallthrough: false }));

app.listen(PORT, HOST, async () => {
  console.log(`[innsaei] bridge on ${PUBLIC_BASE}`);
  console.log(`[innsaei] library at ${library.root}`);
  await provider.start({
    library,
    publicBase: PUBLIC_BASE,
    emitMessage: (message: Message) => broadcast("message", message),
    emitStatus: (status: BridgeStatus) => {
      broadcast("status", status);
      broadcast("chats", library.listChats());
    },
  });
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    await provider.stop();
    process.exit(0);
  });
}
