/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { BridgeStatus, Message } from "../../src/innsaeiCommunication/types";
import type { Provider, ProviderContext } from "./types";

/**
 * Provider used for development and for rehearsing a show without linking a
 * real account: it seeds a couple of chats and then drips messages in so the
 * panel's live capture path can be exercised end to end.
 */
export class MockProvider implements Provider {
  readonly name = "mock";
  private context?: ProviderContext;
  private timer?: NodeJS.Timeout;
  private counter = 0;

  status(): BridgeStatus {
    return {
      connected: Boolean(this.context),
      provider: this.name,
      account: "mock account",
      libraryPath: this.context?.library.root,
    };
  }

  async start(context: ProviderContext): Promise<void> {
    this.context = context;

    const seeds = [
      { id: "66812345678@c.us", kind: "contact" as const, name: "Jalwa Club - Floor Manager" },
      {
        id: "120363010101010101@g.us",
        kind: "group" as const,
        name: "JALWA VISUALS CREW",
        participants: 9,
      },
    ];
    for (const seed of seeds) {
      context.library.upsertChat({ ...seed, lastActivity: new Date().toISOString() });
    }
    context.emitStatus(this.status());

    // Every 30s, capture a synthetic message with a generated PNG attachment.
    this.timer = setInterval(() => this.emitSynthetic(), 30_000);
  }

  async stop(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    this.context = undefined;
  }

  async reply(chatId: string, body: string): Promise<Message> {
    if (!this.context) throw new Error("provider not started");
    const message: Message = {
      id: `mock-out-${Date.now()}`,
      chatId,
      timestamp: new Date().toISOString(),
      author: "me",
      direction: "out",
      body,
    };
    const stored = this.context.library.addMessage(message);
    this.context.emitMessage(stored);
    return stored;
  }

  private emitSynthetic(): void {
    if (!this.context) return;
    const chats = this.context.library.listChats();
    const chat = chats[this.counter % chats.length];
    if (!chat) return;

    const messageId = `mock-in-${Date.now()}`;
    const asset = this.context.library.storeAsset({
      chatId: chat.id,
      messageId,
      fileName: `mock-capture-${this.counter}.png`,
      mimeType: "image/png",
      data: solidPng(),
      publicBase: this.context.publicBase,
      width: 16,
      height: 16,
    });

    const stored = this.context.library.addMessage({
      id: messageId,
      chatId: chat.id,
      timestamp: new Date().toISOString(),
      author: chat.kind === "group" ? "Crew member" : chat.name,
      direction: "in",
      body: `Mock capture #${this.counter}`,
      asset,
    });

    this.counter += 1;
    this.context.emitMessage(stored);
  }
}

/** Smallest valid PNG, so the mock writes a real image file to the library. */
function solidPng(): Buffer {
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAFklEQVR42mNkYPhfz0BFwDiqYVTDkNMAAG0vB7QM6Bh0AAAAAElFTkSuQmCC",
    "base64",
  );
}
