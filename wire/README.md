# Innsaei Communication — Resolume integration

## What runs where

Resolume **Wire** is a generative patcher: its nodes produce and route
parameters, textures and generative geometry. It has no HTTP client, no
filesystem browser and no way to host a chat UI, so the WhatsApp panel itself
cannot be a Wire patch — a patch can only receive values that something else
feeds it.

So the integration is two pieces:

1. **The panel** (`src/innsaeiCommunication/`) — the Arena-styled WhatsApp
   browser, served by this project and shown inside Arena as a **Web Page**
   source. This is where contacts and groups open like source folders, where
   every message and file is captured, and where you drag a capture onto a clip.
2. **The bridge** (`bridge/`) — the local service that talks to WhatsApp,
   stores captures in a folder Arena can index, and serves them to the panel.

## Putting the panel in Arena

1. Run the bridge: `npm run bridge` (see `bridge/README.md`).
2. Run the panel: `npm run dev`.
3. In Arena: **Sources → Web Page**, drop it on a clip, and set its URL to
   `http://127.0.0.1:3000/panel`. Put that layer on a preview/monitor output
   rather than the program output.
4. Optional: pass a different bridge with
   `http://127.0.0.1:3000/panel?bridge=http://127.0.0.1:7455`.

## Dragging a capture onto a clip

Select a capture and drag its preview (in the grid, the thread or the
inspector) onto any clip slot. The drag carries the file itself, so Arena loads
it as that clip's source the same way a file dragged from Finder or Explorer
does. Images, video and audio can be dropped on a clip; documents cannot, and
the panel marks those.

If a build of Arena's web view refuses the file drag, use the fallback: the
same files are on disk in the bridge library, so add `library/` as a source
folder in Arena's own file browser and drag from there.

## Feeding a Wire patch from the bridge

For patches that should *react* to traffic (a message counter driving a
generator, an unread badge, a "now playing" text node), read the bridge's SSE
stream and forward the values into Wire as parameters — Wire takes OSC and MIDI
input, so a small forwarder is all that sits between them:

| Bridge event | Suggested Wire input |
| --- | --- |
| `message` on a watched chat | OSC `/innsaei/message` bang → trigger node |
| unread count per chat | OSC `/innsaei/unread/<slug>` float → parameter |
| `status.connected` | OSC `/innsaei/connected` 0/1 → switch node |

The forwarder is not included here: which chats matter and which patch
parameters they drive are per-show decisions, and the SSE stream in
`bridge/README.md` is the whole contract it needs.
