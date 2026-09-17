/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Asset, Chat, Message, Snapshot } from "./types";

/**
 * Sample library used when the bridge is not running, so the panel can be
 * laid out and demoed without a paired WhatsApp account. The bridge serves
 * the exact same shapes from the real account.
 */

const now = Date.now();
const at = (minutesAgo: number) => new Date(now - minutesAgo * 60_000).toISOString();

function image(id: string, chatId: string, messageId: string, seed: string, name: string): Asset {
  return {
    id,
    chatId,
    messageId,
    kind: "image",
    fileName: name,
    mimeType: "image/jpeg",
    bytes: 842_112,
    url: `https://picsum.photos/seed/${seed}/1920/1080`,
    thumbnailUrl: `https://picsum.photos/seed/${seed}/320/180`,
    width: 1920,
    height: 1080,
    capturedAt: at(42),
  };
}

export const sampleChats: Chat[] = [
  {
    id: "66812345678@c.us",
    kind: "contact",
    name: "Jalwa Club — Floor Manager",
    avatarUrl: "https://picsum.photos/seed/jalwafloor/96/96",
    unread: 2,
    lastActivity: at(4),
    assetCount: 3,
  },
  {
    id: "120363010101010101@g.us",
    kind: "group",
    name: "JALWA // VISUALS CREW",
    participants: 9,
    avatarUrl: "https://picsum.photos/seed/jalwacrew/96/96",
    unread: 5,
    lastActivity: at(11),
    assetCount: 4,
  },
  {
    id: "120363020202020202@g.us",
    kind: "group",
    name: "Bangkok Artist Riders",
    participants: 24,
    avatarUrl: "https://picsum.photos/seed/riders/96/96",
    unread: 0,
    lastActivity: at(96),
    assetCount: 2,
  },
  {
    id: "66898765432@c.us",
    kind: "contact",
    name: "Nok — Lighting",
    avatarUrl: "https://picsum.photos/seed/nok/96/96",
    unread: 0,
    lastActivity: at(180),
    assetCount: 1,
  },
];

const floorAssets = [
  image("a-floor-1", "66812345678@c.us", "m-floor-2", "jalwaposter", "jalwa-poster-saturday.jpg"),
  image("a-floor-2", "66812345678@c.us", "m-floor-4", "jalwastage", "stage-plan-render.jpg"),
  image("a-floor-3", "66812345678@c.us", "m-floor-6", "jalwalogo", "club-logo-white.png"),
];

const crewAssets = [
  image("a-crew-1", "120363010101010101@g.us", "m-crew-2", "crewloop", "tunnel-loop-frame.jpg"),
  image("a-crew-2", "120363010101010101@g.us", "m-crew-3", "crewmask", "logo-mask-alpha.png"),
  image("a-crew-3", "120363010101010101@g.us", "m-crew-5", "crewcrowd", "crowd-plate-01.jpg"),
];

export const sampleMessages: Record<string, Message[]> = {
  "66812345678@c.us": [
    {
      id: "m-floor-1",
      chatId: "66812345678@c.us",
      timestamp: at(58),
      author: "Jalwa Club — Floor Manager",
      direction: "in",
      body: "Saturday set moves to 23:30. Can you have the new poster on the side screens?",
    },
    {
      id: "m-floor-2",
      chatId: "66812345678@c.us",
      timestamp: at(55),
      author: "Jalwa Club — Floor Manager",
      direction: "in",
      body: "Here is the artwork",
      asset: floorAssets[0],
    },
    {
      id: "m-floor-3",
      chatId: "66812345678@c.us",
      timestamp: at(50),
      author: "me",
      direction: "out",
      body: "Got it, dropping it into deck 2 now.",
      replyTo: "m-floor-2",
    },
    {
      id: "m-floor-4",
      chatId: "66812345678@c.us",
      timestamp: at(30),
      author: "Jalwa Club — Floor Manager",
      direction: "in",
      body: "Updated stage plan too",
      asset: floorAssets[1],
    },
    {
      id: "m-floor-5",
      chatId: "66812345678@c.us",
      timestamp: at(12),
      author: "Jalwa Club — Floor Manager",
      direction: "in",
      body: "Owner wants the logo bumper between sets.",
    },
    {
      id: "m-floor-6",
      chatId: "66812345678@c.us",
      timestamp: at(4),
      author: "Jalwa Club — Floor Manager",
      direction: "in",
      body: "White version",
      asset: floorAssets[2],
    },
  ],
  "120363010101010101@g.us": [
    {
      id: "m-crew-1",
      chatId: "120363010101010101@g.us",
      timestamp: at(140),
      author: "Ploy",
      direction: "in",
      body: "Rendered the tunnel loop at 4K, 30s seamless.",
    },
    {
      id: "m-crew-2",
      chatId: "120363010101010101@g.us",
      timestamp: at(138),
      author: "Ploy",
      direction: "in",
      body: "Frame grab for reference",
      asset: crewAssets[0],
    },
    {
      id: "m-crew-3",
      chatId: "120363010101010101@g.us",
      timestamp: at(90),
      author: "Arun",
      direction: "in",
      body: "Alpha mask for the logo reveal",
      asset: crewAssets[1],
    },
    {
      id: "m-crew-4",
      chatId: "120363010101010101@g.us",
      timestamp: at(74),
      author: "me",
      direction: "out",
      body: "Mask is clean. Using it on layer 5 with the feedback effect.",
      replyTo: "m-crew-3",
    },
    {
      id: "m-crew-5",
      chatId: "120363010101010101@g.us",
      timestamp: at(11),
      author: "Nok",
      direction: "in",
      body: "Crowd plate from last night",
      asset: crewAssets[2],
    },
  ],
  "120363020202020202@g.us": [
    {
      id: "m-riders-1",
      chatId: "120363020202020202@g.us",
      timestamp: at(260),
      author: "Mai",
      direction: "in",
      body: "Rider PDF for the Friday headliner is in the group description.",
    },
    {
      id: "m-riders-2",
      chatId: "120363020202020202@g.us",
      timestamp: at(96),
      author: "Mai",
      direction: "in",
      body: "Backdrop artwork",
      asset: image("a-riders-1", "120363020202020202@g.us", "m-riders-2", "riderart", "headliner-backdrop.jpg"),
    },
  ],
  "66898765432@c.us": [
    {
      id: "m-nok-1",
      chatId: "66898765432@c.us",
      timestamp: at(200),
      author: "Nok — Lighting",
      direction: "in",
      body: "Sending the gel colour reference so the visuals match the wash.",
    },
    {
      id: "m-nok-2",
      chatId: "66898765432@c.us",
      timestamp: at(180),
      author: "Nok — Lighting",
      direction: "in",
      body: "Reference",
      asset: image("a-nok-1", "66898765432@c.us", "m-nok-2", "gelref", "gel-reference.jpg"),
    },
  ],
};

export const sampleSnapshot: Snapshot = {
  status: {
    connected: false,
    provider: "sample",
    account: "sample library (bridge offline)",
  },
  chats: sampleChats,
};

export function sampleAssets(chatId: string): Asset[] {
  return (sampleMessages[chatId] ?? [])
    .map((message) => message.asset)
    .filter((asset): asset is Asset => Boolean(asset));
}
