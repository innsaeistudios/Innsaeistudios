/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Plug, PlugZap, Settings2 } from "lucide-react";
import { useState } from "react";
import { bridgeBaseUrl, setBridgeBaseUrl } from "../bridgeClient";
import type { BridgeStatus } from "../types";

interface Props {
  status: BridgeStatus;
}

/** Bottom strip: bridge connection, provider, library folder, QR pairing. */
export default function BridgeStatusBar({ status }: Props) {
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(bridgeBaseUrl());

  return (
    <div className="rc-panel rc-outline px-2 py-1.5 text-[10px] text-[var(--rc-text-dim)]">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="flex items-center gap-1">
          {status.connected ? (
            <PlugZap size={12} className="text-[var(--rc-ok)]" />
          ) : (
            <Plug size={12} className="text-[var(--rc-warn)]" />
          )}
          <span className={status.connected ? "text-[var(--rc-ok)]" : "text-[var(--rc-warn)]"}>
            {status.connected ? "bridge connected" : "bridge offline"}
          </span>
        </span>

        <span>provider: {status.provider}</span>
        {status.account && <span>account: {status.account}</span>}
        {status.libraryPath && <span className="truncate">library: {status.libraryPath}</span>}
        {status.error && <span className="text-[var(--rc-warn)]">{status.error}</span>}

        <button
          type="button"
          onClick={() => setEditing((value) => !value)}
          className="ml-auto flex items-center gap-1 hover:text-[var(--rc-text)]"
        >
          <Settings2 size={12} /> {bridgeBaseUrl()}
        </button>
      </div>

      {editing && (
        <div className="mt-1.5 flex items-center gap-2">
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            className="flex-1 bg-[var(--rc-field)] border border-[var(--rc-line)] px-2 py-1 text-[11px] text-[var(--rc-text)] focus:outline-none focus:border-[var(--rc-accent)]"
          />
          <button
            type="button"
            onClick={() => {
              setBridgeBaseUrl(url);
              window.location.reload();
            }}
            className="border border-[var(--rc-line)] bg-[var(--rc-button)] px-2 py-1 uppercase tracking-widest hover:border-[var(--rc-accent)]"
          >
            Reconnect
          </button>
        </div>
      )}

      {status.qr && (
        <div className="mt-2 flex items-center gap-3 border border-[var(--rc-line)] p-2">
          <img src={status.qr} alt="WhatsApp pairing QR code" className="w-28 h-28 bg-white p-1" />
          <p className="text-[11px] leading-relaxed">
            Scan this code in WhatsApp → Settings → Linked devices to pair the bridge with your account.
          </p>
        </div>
      )}
    </div>
  );
}
