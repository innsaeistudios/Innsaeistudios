/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChevronDown, ChevronRight, Folder, FolderOpen, Search, User, Users } from "lucide-react";
import { useMemo, useState } from "react";
import type { Chat } from "../types";

interface Props {
  chats: Chat[];
  openChatId?: string;
  onOpenChat: (chatId: string) => void;
}

/**
 * Resolume's Sources/Effects tree, but the folders are WhatsApp contacts and
 * groups. Clicking one opens it the way a source folder opens.
 */
export default function ChatBrowser({ chats, openChatId, onOpenChat }: Props) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matching = needle ? chats.filter((chat) => chat.name.toLowerCase().includes(needle)) : chats;
    return [
      { key: "group" as const, label: "Groups", icon: Users, items: matching.filter((c) => c.kind === "group") },
      { key: "contact" as const, label: "Contacts", icon: User, items: matching.filter((c) => c.kind === "contact") },
    ];
  }, [chats, query]);

  return (
    <div className="flex flex-col h-full rc-panel rc-outline">
      <div className="rc-header">Innsaei Communication</div>

      <div className="flex items-center gap-2 px-2 py-1.5 border-b border-[var(--rc-line)]">
        <Search size={12} className="text-[var(--rc-text-dim)]" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter chats"
          className="w-full bg-transparent text-[11px] text-[var(--rc-text)] placeholder:text-[var(--rc-text-dim)] focus:outline-none"
        />
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {groups.map((group) => {
          const isCollapsed = collapsed[group.key];
          const Caret = isCollapsed ? ChevronRight : ChevronDown;
          return (
            <div key={group.key}>
              <button
                type="button"
                onClick={() => setCollapsed((state) => ({ ...state, [group.key]: !state[group.key] }))}
                className="w-full flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--rc-text-dim)] hover:text-[var(--rc-text)]"
              >
                <Caret size={12} />
                <group.icon size={12} />
                {group.label}
                <span className="ml-auto">{group.items.length}</span>
              </button>

              {!isCollapsed &&
                group.items.map((chat) => {
                  const open = chat.id === openChatId;
                  const FolderIcon = open ? FolderOpen : Folder;
                  return (
                    <button
                      key={chat.id}
                      type="button"
                      onClick={() => onOpenChat(chat.id)}
                      className={`w-full flex items-center gap-2 pl-6 pr-2 py-1 text-[11px] text-left ${
                        open
                          ? "bg-[var(--rc-accent)] text-black"
                          : "text-[var(--rc-text)] hover:bg-[var(--rc-hover)]"
                      }`}
                    >
                      <FolderIcon size={12} className="shrink-0" />
                      <span className="truncate">{chat.name}</span>
                      {chat.unread > 0 && (
                        <span
                          className={`ml-auto shrink-0 px-1 text-[9px] ${
                            open ? "bg-black/30 text-black" : "bg-[var(--rc-unread)] text-black"
                          }`}
                        >
                          {chat.unread}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
