/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** Shared contract between the Innsaei Communication bridge and the panel UI. */

export type ChatKind = "contact" | "group";

export type AssetKind = "image" | "video" | "audio" | "document" | "text";

export interface Chat {
  /** WhatsApp JID, e.g. "4471234567@c.us" or "12036...@g.us". */
  id: string;
  kind: ChatKind;
  name: string;
  /** Group participant count, undefined for contacts. */
  participants?: number;
  avatarUrl?: string;
  unread: number;
  lastActivity: string;
  /** Number of capturable media items the bridge has stored for this chat. */
  assetCount: number;
}

export interface Message {
  id: string;
  chatId: string;
  timestamp: string;
  /** Display name of the sender; "me" messages are outgoing replies. */
  author: string;
  direction: "in" | "out";
  body: string;
  /** Present when the message carried media the bridge stored. */
  asset?: Asset;
  /** Message id this one replied to, when it is a quoted reply. */
  replyTo?: string;
}

export interface Asset {
  id: string;
  chatId: string;
  messageId: string;
  kind: AssetKind;
  /** File name as stored in the bridge library. */
  fileName: string;
  mimeType: string;
  bytes: number;
  /** Bridge URL serving the full-resolution file. */
  url: string;
  /** Bridge URL serving a small still for the browser grid. */
  thumbnailUrl: string;
  width?: number;
  height?: number;
  /** Seconds, for video and audio. */
  duration?: number;
  capturedAt: string;
}

export interface BridgeStatus {
  connected: boolean;
  /** "mock" when running on sample data, otherwise the provider name. */
  provider: string;
  /** Absolute path of the library folder Resolume can also index directly. */
  libraryPath?: string;
  account?: string;
  /** Data URL of the pairing QR code while the provider waits for a scan. */
  qr?: string;
  error?: string;
}

export interface Snapshot {
  status: BridgeStatus;
  chats: Chat[];
}
