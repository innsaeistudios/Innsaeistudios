/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { sampleAssets, sampleMessages, sampleSnapshot } from "./sampleLibrary";
import type { Asset, Message, Snapshot } from "./types";

/**
 * Talks to the local Innsaei Communication bridge (see bridge/README.md).
 * Every call falls back to the sample library when the bridge is not
 * reachable, so the panel is always usable inside Resolume's web view.
 */

const DEFAULT_BRIDGE = "http://127.0.0.1:7455";

export function bridgeBaseUrl(): string {
  const override = new URLSearchParams(window.location.search).get("bridge");
  return override || localStorage.getItem("innsaei.bridgeUrl") || DEFAULT_BRIDGE;
}

export function setBridgeBaseUrl(url: string): void {
  localStorage.setItem("innsaei.bridgeUrl", url.replace(/\/$/, ""));
}

async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${bridgeBaseUrl()}${path}`, { signal });
  if (!response.ok) throw new Error(`bridge ${response.status} on ${path}`);
  return (await response.json()) as T;
}

export async function fetchSnapshot(signal?: AbortSignal): Promise<Snapshot> {
  try {
    return await get<Snapshot>("/api/snapshot", signal);
  } catch {
    return sampleSnapshot;
  }
}

export async function fetchMessages(chatId: string, signal?: AbortSignal): Promise<Message[]> {
  try {
    return await get<Message[]>(`/api/chats/${encodeURIComponent(chatId)}/messages`, signal);
  } catch {
    return sampleMessages[chatId] ?? [];
  }
}

export async function fetchAssets(chatId: string, signal?: AbortSignal): Promise<Asset[]> {
  try {
    return await get<Asset[]>(`/api/chats/${encodeURIComponent(chatId)}/assets`, signal);
  } catch {
    return sampleAssets(chatId);
  }
}

export async function sendReply(chatId: string, body: string): Promise<Message | null> {
  try {
    const response = await fetch(`${bridgeBaseUrl()}/api/chats/${encodeURIComponent(chatId)}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (!response.ok) throw new Error(`bridge ${response.status}`);
    return (await response.json()) as Message;
  } catch {
    return null;
  }
}

/** Live message/chat updates over SSE. Returns an unsubscribe function. */
export function subscribe(onEvent: (event: { type: string; payload: unknown }) => void): () => void {
  let source: EventSource | null = null;
  let retry: number | undefined;
  let closed = false;

  const open = () => {
    if (closed) return;
    try {
      source = new EventSource(`${bridgeBaseUrl()}/api/events`);
    } catch {
      return;
    }
    source.onmessage = (event) => {
      try {
        onEvent(JSON.parse(event.data));
      } catch {
        /* ignore malformed frames */
      }
    };
    source.onerror = () => {
      source?.close();
      source = null;
      // The bridge is often started after the panel; keep trying quietly.
      retry = window.setTimeout(open, 5_000);
    };
  };

  open();

  return () => {
    closed = true;
    if (retry) window.clearTimeout(retry);
    source?.close();
  };
}
