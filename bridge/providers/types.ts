/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { BridgeStatus, Message } from "../../src/innsaeiCommunication/types";
import type { Library } from "../library";

export interface ProviderContext {
  library: Library;
  /** The bridge's own origin, e.g. "http://127.0.0.1:7455". */
  publicBase: string;
  /** Push a captured message to every connected panel. */
  emitMessage: (message: Message) => void;
  /** Push a status change (pairing QR, connection, errors) to the panels. */
  emitStatus: (status: BridgeStatus) => void;
}

export interface Provider {
  readonly name: string;
  status(): BridgeStatus;
  start(context: ProviderContext): Promise<void>;
  stop(): Promise<void>;
  /** Sends a reply and returns the message as stored in the library. */
  reply(chatId: string, body: string): Promise<Message>;
}
