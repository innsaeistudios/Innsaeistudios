# Innsaei Communication — handoff to desktop Claude Code

Everything described here is already committed and pushed on
`claude/innsaei-whatsapp-resolume-patch-t4u728`. Nothing is half-finished; this
note exists so the next session (on the machine that actually runs Arena) can
pick up without re-deriving the context.

## Pick up where this left off

On the machine running Resolume Arena, in your clone:

```bash
git fetch origin claude/innsaei-whatsapp-resolume-patch-t4u728
git checkout claude/innsaei-whatsapp-resolume-patch-t4u728
npm install
```

Then open Claude Code in that folder and say what you want next. Two terminals
run the thing:

```bash
npm run bridge   # capture service + local library (mock data by default)
npm run dev      # serves the panel on http://127.0.0.1:3000
```

In Arena: **Sources → Web Page**, drop it on a clip, set the URL to
`http://127.0.0.1:3000/panel`. Keep that layer on a preview monitor, not the
program output.

For a real account instead of mock data:

```bash
npm install whatsapp-web.js qrcode
INNSAEI_PROVIDER=whatsapp-web npm run bridge
```

A pairing QR appears in the panel's status bar — scan it in WhatsApp →
Settings → Linked devices. The session persists in `<library>/.session`.

## The one open question

**Does dragging a capture out of Arena's embedded web view onto a clip slot
work?** This is the only thing that could not be tested from the cloud session.

- The drag payload itself is correct and verified in Chromium: the dragged item
  carries `DownloadURL` (`image/jpeg:name.jpg:<url>`) plus `text/uri-list`,
  `text/plain` and a JSON flavour, which is exactly what turns a browser drag
  into an OS file drop.
- Arena's web view is CEF-based, and whether CEF hands that file drag to its
  host application is untested. If it silently does nothing, that is the
  reason — not a bug in the payload.

Two fallbacks already work if CEF refuses:

1. Run the panel in Chrome or Edge on a second monitor beside Arena and drag
   from there. Same panel, same drag, a normal browser window.
2. Add the bridge's `library/` folder as a source folder in Arena's own file
   browser. Every capture is written to disk per chat, so you drag from
   Arena's native browser instead.

If CEF does block it, the better fix is a small Electron shell around the
panel so the drag comes from a native window (`webContents.startDrag`). That
was scoped but not built — decide it after testing the web view.

## Where things are

| Path | What it is |
| --- | --- |
| `src/innsaeiCommunication/` | the panel: chat browser, thread, capture grid, inspector, status bar |
| `src/innsaeiCommunication/dragOut.ts` | the drag payload — the file to look at if drag-to-clip misbehaves |
| `bridge/` | capture service: Express + SSE, library on disk, providers |
| `bridge/providers/` | `mock` (default) and `whatsappWeb` (optional linked device) |
| `src/pages/Communication.tsx` | `/communication`, the hosted page with setup notes |
| `/panel` route (in `src/App.tsx`) | the bare panel Arena loads |
| `bridge/README.md` | bridge API, env vars, library layout, pairing |
| `wire/README.md` | why this is not a Wire patch, and how to drive a Wire patch from the bridge over OSC |

## Things worth knowing before changing anything

- **Wire cannot host this.** Wire routes parameters, textures and geometry; it
  has no HTTP client and cannot host a UI. The panel is a Web Page source, and
  a Wire patch can only be *fed* from the bridge over OSC. `wire/README.md`
  has the suggested address map.
- **The bridge binds to loopback** and nothing leaves the machine. Keep it that
  way — captured messages and media are the user's private WhatsApp history.
- **`whatsapp-web.js` is unofficial** and an optional dependency, so the
  project installs and typechecks without it. For a business number, WhatsApp's
  Cloud API is the supported route; add it as another provider implementing
  `bridge/providers/types.ts` and select it with `INNSAEI_PROVIDER`.
- **The panel works with the bridge offline**, falling back to
  `sampleLibrary.ts` so the layout can be worked on without pairing anything.
  Replies are disabled in that state.
- `npm run lint` is `tsc --noEmit`; both it and `npm run build` pass on this
  branch. The CSS `@import` warning during build is pre-existing on `main`.
