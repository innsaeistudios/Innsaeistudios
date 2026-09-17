/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchAssets, fetchMessages, fetchSnapshot, sendReply, subscribe } from "./bridgeClient";
import AssetCard from "./components/AssetCard";
import AssetInspector from "./components/AssetInspector";
import BridgeStatusBar from "./components/BridgeStatusBar";
import ChatBrowser from "./components/ChatBrowser";
import ChatThread from "./components/ChatThread";
import { sampleSnapshot } from "./sampleLibrary";
import type { Asset, Chat, Message, Snapshot } from "./types";

/**
 * The whole Innsaei Communication panel: chat browser on the left, the open
 * chat's thread and captured media in the middle, inspector on the right.
 * Fills its container, so it works both as a page and inside Resolume's
 * web-page source at whatever size the layout gives it.
 */
export default function CommunicationPanel() {
  const [snapshot, setSnapshot] = useState<Snapshot>(sampleSnapshot);
  const [openChatId, setOpenChatId] = useState<string | undefined>(sampleSnapshot.chats[0]?.id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | undefined>();

  const loadSnapshot = useCallback(async (signal?: AbortSignal) => {
    const next = await fetchSnapshot(signal);
    setSnapshot(next);
    setOpenChatId((current) =>
      current && next.chats.some((chat) => chat.id === current) ? current : next.chats[0]?.id,
    );
  }, []);

  const loadChat = useCallback(async (chatId: string, signal?: AbortSignal) => {
    const [nextMessages, nextAssets] = await Promise.all([
      fetchMessages(chatId, signal),
      fetchAssets(chatId, signal),
    ]);
    setMessages(nextMessages);
    setAssets(nextAssets);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadSnapshot(controller.signal);
    return () => controller.abort();
  }, [loadSnapshot]);

  useEffect(() => {
    if (!openChatId) return;
    const controller = new AbortController();
    setSelectedAsset(undefined);
    void loadChat(openChatId, controller.signal);
    return () => controller.abort();
  }, [openChatId, loadChat]);

  // Live capture: the bridge pushes every new message and stored file.
  useEffect(() => {
    return subscribe((event) => {
      if (event.type === "message") {
        const message = event.payload as Message;
        if (message.chatId === openChatId) {
          setMessages((current) =>
            current.some((existing) => existing.id === message.id) ? current : [...current, message],
          );
          if (message.asset) {
            const asset = message.asset;
            setAssets((current) =>
              current.some((existing) => existing.id === asset.id) ? current : [...current, asset],
            );
          }
        }
        setSnapshot((current) => ({
          ...current,
          chats: current.chats.map((chat) =>
            chat.id === message.chatId
              ? {
                  ...chat,
                  lastActivity: message.timestamp,
                  unread: chat.id === openChatId || message.direction === "out" ? chat.unread : chat.unread + 1,
                  assetCount: chat.assetCount + (message.asset ? 1 : 0),
                }
              : chat,
          ),
        }));
      }

      if (event.type === "status") {
        setSnapshot((current) => ({ ...current, status: event.payload as Snapshot["status"] }));
      }

      if (event.type === "chats") {
        setSnapshot((current) => ({ ...current, chats: event.payload as Chat[] }));
      }
    });
  }, [openChatId]);

  const openChat = useMemo(
    () => snapshot.chats.find((chat) => chat.id === openChatId),
    [snapshot.chats, openChatId],
  );

  const onOpenChat = (chatId: string) => {
    setOpenChatId(chatId);
    setSnapshot((current) => ({
      ...current,
      chats: current.chats.map((chat) => (chat.id === chatId ? { ...chat, unread: 0 } : chat)),
    }));
  };

  const onReply = async (body: string) => {
    if (!openChatId) return;
    const sent = await sendReply(openChatId, body);
    if (sent) setMessages((current) => [...current, sent]);
  };

  return (
    <div className="rc-root flex flex-col gap-2 h-full min-h-0 p-2">
      <div className="grid flex-1 min-h-0 gap-2 grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_280px]">
        <ChatBrowser chats={snapshot.chats} openChatId={openChatId} onOpenChat={onOpenChat} />

        <div className="grid min-h-0 gap-2 grid-rows-[minmax(0,3fr)_minmax(0,2fr)]">
          {openChat ? (
            <ChatThread
              chat={openChat}
              messages={messages}
              libraryPath={snapshot.status.libraryPath}
              canReply={snapshot.status.connected}
              onSelectAsset={setSelectedAsset}
              onReply={onReply}
            />
          ) : (
            <div className="rc-panel rc-outline flex items-center justify-center text-[11px] text-[var(--rc-text-dim)]">
              No chats yet. Pair the bridge to start capturing.
            </div>
          )}

          <div className="flex flex-col rc-panel rc-outline min-h-0">
            <div className="rc-header flex items-center gap-2">
              <span>Captures</span>
              <span className="ml-auto text-[var(--rc-text-dim)] normal-case tracking-normal">
                {assets.length} files · drag onto a clip
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 min-h-0">
              {assets.length === 0 ? (
                <p className="text-[11px] text-[var(--rc-text-dim)]">
                  Nothing captured in this chat yet.
                </p>
              ) : (
                <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 xl:grid-cols-4">
                  {assets.map((asset) => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      selected={asset.id === selectedAsset?.id}
                      libraryPath={snapshot.status.libraryPath}
                      onSelect={setSelectedAsset}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <AssetInspector asset={selectedAsset} libraryPath={snapshot.status.libraryPath} />
      </div>

      <BridgeStatusBar status={snapshot.status} />
    </div>
  );
}
