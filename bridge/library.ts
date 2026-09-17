/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "node:fs";
import path from "node:path";
import type { Asset, AssetKind, Chat, Message } from "../src/innsaeiCommunication/types";

/**
 * On-disk capture library plus the in-memory index the API serves.
 *
 * Layout (one folder per chat, so Arena can also index the folder directly as
 * a source folder):
 *
 *   <library>/<chat name> (<chat id>)/<timestamp>-<original name>
 *   <library>/index.json
 */
export class Library {
  readonly root: string;
  private chats = new Map<string, Chat>();
  private messages = new Map<string, Message[]>();

  constructor(root: string) {
    this.root = path.resolve(root);
    fs.mkdirSync(this.root, { recursive: true });
    this.load();
  }

  private get indexPath(): string {
    return path.join(this.root, "index.json");
  }

  private load(): void {
    if (!fs.existsSync(this.indexPath)) return;
    try {
      const saved = JSON.parse(fs.readFileSync(this.indexPath, "utf8")) as {
        chats: Chat[];
        messages: Record<string, Message[]>;
      };
      for (const chat of saved.chats ?? []) this.chats.set(chat.id, chat);
      for (const [chatId, list] of Object.entries(saved.messages ?? {})) {
        this.messages.set(chatId, list);
      }
    } catch (error) {
      console.warn("[innsaei] could not read library index, starting empty:", error);
    }
  }

  private persist(): void {
    const payload = {
      chats: [...this.chats.values()],
      messages: Object.fromEntries(this.messages),
    };
    fs.writeFileSync(this.indexPath, JSON.stringify(payload, null, 2));
  }

  listChats(): Chat[] {
    return [...this.chats.values()].sort((a, b) => b.lastActivity.localeCompare(a.lastActivity));
  }

  listMessages(chatId: string): Message[] {
    return this.messages.get(chatId) ?? [];
  }

  listAssets(chatId: string): Asset[] {
    return this.listMessages(chatId)
      .map((message) => message.asset)
      .filter((asset): asset is Asset => Boolean(asset));
  }

  upsertChat(chat: Omit<Chat, "unread" | "assetCount"> & Partial<Pick<Chat, "unread" | "assetCount">>): Chat {
    const existing = this.chats.get(chat.id);
    const merged: Chat = {
      unread: existing?.unread ?? 0,
      assetCount: existing?.assetCount ?? 0,
      ...existing,
      ...chat,
    };
    this.chats.set(merged.id, merged);
    this.persist();
    return merged;
  }

  markRead(chatId: string): void {
    const chat = this.chats.get(chatId);
    if (!chat) return;
    this.chats.set(chatId, { ...chat, unread: 0 });
    this.persist();
  }

  /** Folder for a chat, created on demand. */
  chatDir(chatId: string): string {
    const chat = this.chats.get(chatId);
    const safeName = (chat?.name ?? "unknown").replace(/[^\w\-. ]+/g, "_").slice(0, 60).trim();
    const dir = path.join(this.root, `${safeName} (${chatId.replace(/[^\w.@-]+/g, "_")})`);
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  /**
   * Writes a captured file into the chat's folder and returns the Asset the
   * API serves. `publicBase` is the bridge's own origin.
   */
  storeAsset(params: {
    chatId: string;
    messageId: string;
    fileName: string;
    mimeType: string;
    data: Buffer;
    publicBase: string;
    width?: number;
    height?: number;
    duration?: number;
  }): Asset {
    const dir = this.chatDir(params.chatId);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const safeFile = params.fileName.replace(/[^\w\-. ]+/g, "_") || "capture";
    const fileName = `${stamp}-${safeFile}`;
    fs.writeFileSync(path.join(dir, fileName), params.data);

    const relative = `${path.basename(dir)}/${fileName}`;
    const mediaUrl = `${params.publicBase}/media/${relative.split("/").map(encodeURIComponent).join("/")}`;

    return {
      id: `${params.messageId}-asset`,
      chatId: params.chatId,
      messageId: params.messageId,
      kind: assetKind(params.mimeType),
      fileName,
      mimeType: params.mimeType,
      bytes: params.data.byteLength,
      url: mediaUrl,
      // No transcoding here: the browser scales the original for the grid.
      thumbnailUrl: mediaUrl,
      width: params.width,
      height: params.height,
      duration: params.duration,
      capturedAt: new Date().toISOString(),
    };
  }

  /** Records a message (incoming or our own reply) against its chat. */
  addMessage(message: Message): Message {
    const list = this.messages.get(message.chatId) ?? [];
    if (!list.some((existing) => existing.id === message.id)) list.push(message);
    this.messages.set(message.chatId, list);

    const chat = this.chats.get(message.chatId);
    if (chat) {
      this.chats.set(message.chatId, {
        ...chat,
        lastActivity: message.timestamp,
        unread: message.direction === "in" ? chat.unread + 1 : chat.unread,
        assetCount: chat.assetCount + (message.asset ? 1 : 0),
      });
    }

    this.persist();
    return message;
  }
}

export function assetKind(mimeType: string): AssetKind {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "document";
}
