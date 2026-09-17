/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { BridgeStatus, Message } from "../../src/innsaeiCommunication/types";
import type { Provider, ProviderContext } from "./types";

/**
 * Real-account provider, backed by whatsapp-web.js (a linked-device session,
 * the same mechanism as WhatsApp Web). It is an optional dependency so the
 * bridge and panel install and run without a browser engine:
 *
 *   npm install whatsapp-web.js qrcode
 *   INNSAEI_PROVIDER=whatsapp-web npm run bridge
 *
 * The session is stored under <library>/.session so pairing survives restarts.
 */
export class WhatsAppWebProvider implements Provider {
  readonly name = "whatsapp-web";
  private context?: ProviderContext;
  private client?: any;
  private state: BridgeStatus = { connected: false, provider: "whatsapp-web" };

  status(): BridgeStatus {
    return { ...this.state, libraryPath: this.context?.library.root };
  }

  async start(context: ProviderContext): Promise<void> {
    this.context = context;

    let wweb: any;
    let qrcode: any;
    try {
      // Indirect specifiers: these are optional dependencies, so the project
      // must typecheck and run when they are not installed.
      wweb = await import(/* @vite-ignore */ "whatsapp-web" + ".js");
      qrcode = await import(/* @vite-ignore */ "qr" + "code");
    } catch {
      this.state = {
        connected: false,
        provider: this.name,
        error: "whatsapp-web.js and qrcode are not installed — run: npm install whatsapp-web.js qrcode",
      };
      context.emitStatus(this.status());
      return;
    }

    const { Client, LocalAuth } = wweb.default ?? wweb;
    const client = new Client({
      authStrategy: new LocalAuth({ dataPath: `${context.library.root}/.session` }),
      puppeteer: { args: ["--no-sandbox"] },
    });
    this.client = client;

    client.on("qr", async (qr: string) => {
      this.state = {
        connected: false,
        provider: this.name,
        qr: await (qrcode.default ?? qrcode).toDataURL(qr),
      };
      context.emitStatus(this.status());
    });

    client.on("ready", async () => {
      this.state = {
        connected: true,
        provider: this.name,
        account: client.info?.wid?.user ? `+${client.info.wid.user}` : "linked device",
      };
      await this.syncChats();
      context.emitStatus(this.status());
    });

    client.on("disconnected", (reason: string) => {
      this.state = { connected: false, provider: this.name, error: `disconnected: ${reason}` };
      context.emitStatus(this.status());
    });

    // Capture both directions: what the chat sends and what we reply.
    client.on("message_create", (raw: any) => void this.capture(raw));

    await client.initialize();
  }

  async stop(): Promise<void> {
    await this.client?.destroy?.();
    this.client = undefined;
    this.context = undefined;
    this.state = { connected: false, provider: this.name };
  }

  async reply(chatId: string, body: string): Promise<Message> {
    if (!this.client || !this.context) throw new Error("provider not started");
    // The sent message comes back through message_create, which stores it;
    // this returns an optimistic copy so the panel can render immediately.
    await this.client.sendMessage(chatId, body);
    return {
      id: `out-${Date.now()}`,
      chatId,
      timestamp: new Date().toISOString(),
      author: "me",
      direction: "out",
      body,
    };
  }

  /** Mirrors the account's chat list into the library so folders appear. */
  private async syncChats(): Promise<void> {
    if (!this.client || !this.context) return;
    const chats = await this.client.getChats();
    for (const chat of chats) {
      this.context.library.upsertChat({
        id: chat.id._serialized,
        kind: chat.isGroup ? "group" : "contact",
        name: chat.name ?? chat.id.user,
        participants: chat.isGroup ? chat.participants?.length : undefined,
        lastActivity: new Date((chat.timestamp ?? 0) * 1000 || Date.now()).toISOString(),
      });
    }
    this.context.emitStatus(this.status());
  }

  private async capture(raw: any): Promise<void> {
    if (!this.context) return;
    try {
      const chat = await raw.getChat();
      this.context.library.upsertChat({
        id: chat.id._serialized,
        kind: chat.isGroup ? "group" : "contact",
        name: chat.name ?? chat.id.user,
        participants: chat.isGroup ? chat.participants?.length : undefined,
        lastActivity: new Date().toISOString(),
      });

      const messageId = raw.id?._serialized ?? `msg-${Date.now()}`;
      let asset;
      if (raw.hasMedia) {
        const media = await raw.downloadMedia();
        if (media?.data) {
          asset = this.context.library.storeAsset({
            chatId: chat.id._serialized,
            messageId,
            fileName: media.filename ?? `${messageId}.${extensionFor(media.mimetype)}`,
            mimeType: media.mimetype ?? "application/octet-stream",
            data: Buffer.from(media.data, "base64"),
            publicBase: this.context.publicBase,
            duration: raw.duration ? Number(raw.duration) : undefined,
          });
        }
      }

      const contact = raw.fromMe ? undefined : await raw.getContact();
      const stored = this.context.library.addMessage({
        id: messageId,
        chatId: chat.id._serialized,
        timestamp: new Date((raw.timestamp ?? 0) * 1000 || Date.now()).toISOString(),
        author: raw.fromMe ? "me" : contact?.pushname || contact?.number || "unknown",
        direction: raw.fromMe ? "out" : "in",
        body: raw.body ?? "",
        asset,
        replyTo: raw.hasQuotedMsg ? (await raw.getQuotedMessage())?.id?._serialized : undefined,
      });

      this.context.emitMessage(stored);
    } catch (error) {
      console.warn("[innsaei] failed to capture a message:", error);
    }
  }
}

function extensionFor(mimeType?: string): string {
  if (!mimeType) return "bin";
  const subtype = mimeType.split("/")[1] ?? "bin";
  return subtype.split(";")[0];
}
