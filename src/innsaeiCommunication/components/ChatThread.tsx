/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CornerDownLeft, Paperclip, Reply } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { startAssetDrag } from "../dragOut";
import type { Asset, Chat, Message } from "../types";

interface Props {
  chat: Chat;
  messages: Message[];
  libraryPath?: string;
  canReply: boolean;
  onSelectAsset: (asset: Asset) => void;
  onReply: (body: string) => Promise<void>;
}

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** Everything sent to the chat and everything replied, media inline. */
export default function ChatThread({
  chat,
  messages,
  libraryPath,
  canReply,
  onSelectAsset,
  onReply,
}: Props) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  const byId = useMemo(() => new Map(messages.map((message) => [message.id, message])), [messages]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages.length, chat.id]);

  const submit = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await onReply(body);
      setDraft("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full rc-panel rc-outline min-h-0">
      <div className="rc-header flex items-center gap-2">
        <span className="truncate">{chat.name}</span>
        <span className="ml-auto text-[var(--rc-text-dim)] normal-case tracking-normal">
          {chat.kind === "group" ? `${chat.participants ?? 0} participants` : "contact"} · {messages.length} messages
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
        {messages.map((message) => {
          const outgoing = message.direction === "out";
          const quoted = message.replyTo ? byId.get(message.replyTo) : undefined;
          return (
            <div key={message.id} className={`flex ${outgoing ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] border px-2 py-1.5 ${
                  outgoing
                    ? "bg-[var(--rc-out)] border-[var(--rc-line)]"
                    : "bg-[var(--rc-in)] border-[var(--rc-line)]"
                }`}
              >
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-[10px] uppercase tracking-widest text-[var(--rc-accent)]">
                    {outgoing ? "reply" : message.author}
                  </span>
                  <span className="text-[10px] text-[var(--rc-text-dim)]">{time(message.timestamp)}</span>
                </div>

                {quoted && (
                  <div className="mb-1 flex items-start gap-1 border-l-2 border-[var(--rc-accent)] pl-2 text-[10px] text-[var(--rc-text-dim)]">
                    <Reply size={10} className="mt-0.5 shrink-0" />
                    <span className="truncate">{quoted.body || quoted.asset?.fileName}</span>
                  </div>
                )}

                {message.body && <p className="text-[12px] text-[var(--rc-text)] whitespace-pre-wrap">{message.body}</p>}

                {message.asset && (
                  <div
                    draggable
                    onDragStart={(event) => startAssetDrag(event, message.asset!, libraryPath)}
                    onClick={() => onSelectAsset(message.asset!)}
                    title="Drag onto a clip slot"
                    className="mt-1 cursor-grab active:cursor-grabbing border border-[var(--rc-line)] hover:border-[var(--rc-accent)]"
                  >
                    <img
                      src={message.asset.thumbnailUrl}
                      alt={message.asset.fileName}
                      draggable={false}
                      referrerPolicy="no-referrer"
                      className="w-56 max-w-full max-h-40 object-cover"
                    />
                    <div className="flex items-center gap-1 px-1.5 py-1 text-[10px] text-[var(--rc-text-dim)]">
                      <Paperclip size={10} />
                      <span className="truncate">{message.asset.fileName}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>

      <div className="border-t border-[var(--rc-line)] p-2">
        <div className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void submit();
              }
            }}
            placeholder={canReply ? "Reply to this chat" : "Bridge offline — replies disabled"}
            disabled={!canReply || sending}
            className="flex-1 bg-[var(--rc-field)] border border-[var(--rc-line)] px-2 py-1 text-[12px] text-[var(--rc-text)] placeholder:text-[var(--rc-text-dim)] focus:outline-none focus:border-[var(--rc-accent)] disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!canReply || sending || !draft.trim()}
            className="flex items-center gap-1 border border-[var(--rc-line)] bg-[var(--rc-button)] px-2 py-1 text-[10px] uppercase tracking-widest text-[var(--rc-text)] hover:border-[var(--rc-accent)] disabled:opacity-40"
          >
            Send <CornerDownLeft size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}
