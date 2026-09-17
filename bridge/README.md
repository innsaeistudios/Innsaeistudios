# Innsaei Communication — bridge

Captures a WhatsApp account into a local library and serves it to the Resolume
panel. Everything stays on the machine running Arena; nothing is sent anywhere
but your own loopback interface.

## Run

```bash
npm install
npm run bridge                                # mock data, no account needed
INNSAEI_PROVIDER=whatsapp-web npm run bridge  # real account (see below)
```

Then start the panel (`npm run dev`) and open `http://127.0.0.1:3000/panel`.

### Real account

The real provider uses a **linked device** session, the same mechanism as
WhatsApp Web, through `whatsapp-web.js`. It is an optional dependency so the
rest of the project installs without a browser engine:

```bash
npm install whatsapp-web.js qrcode
INNSAEI_PROVIDER=whatsapp-web npm run bridge
```

The panel's status bar shows a pairing QR code — scan it in WhatsApp →
Settings → Linked devices. The session is stored in `<library>/.session`, so
you only pair once.

`whatsapp-web.js` is an unofficial client and is not endorsed by WhatsApp; use
it with an account you own. For a business number, WhatsApp's official Cloud
API is the supported route — add it as another provider implementing
`bridge/providers/types.ts` and select it with `INNSAEI_PROVIDER`.

## Environment

| Variable | Default | Meaning |
| --- | --- | --- |
| `INNSAEI_PROVIDER` | `mock` | `mock` or `whatsapp-web` |
| `INNSAEI_BRIDGE_PORT` | `7455` | HTTP port |
| `INNSAEI_BRIDGE_HOST` | `127.0.0.1` | bind address — keep it on loopback |
| `INNSAEI_BRIDGE_PUBLIC_BASE` | `http://<host>:<port>` | origin used in media URLs |
| `INNSAEI_LIBRARY` | `./library` | capture folder |

## API

| Route | Purpose |
| --- | --- |
| `GET /api/snapshot` | bridge status + chat list |
| `GET /api/chats/:id/messages` | full captured thread, both directions |
| `GET /api/chats/:id/assets` | captured files for that chat |
| `POST /api/chats/:id/reply` | send a reply (`{ "body": "..." }`) |
| `GET /api/events` | SSE stream of `message`, `status`, `chats` events |
| `GET /media/...` | the captured files themselves |

## Library layout

```
library/
  index.json                                  # chat + message index
  JALWA VISUALS CREW (12036...@g.us)/
    2026-09-17T21-04-11-123Z-logo-mask.png
  Jalwa Club - Floor Manager (66812345678@c.us)/
    2026-09-17T20-58-02-004Z-poster.jpg
```

Point Arena's **Sources → File browser** at `library/` and every chat also
appears as an ordinary source folder, which is the fallback if you would rather
drag from Arena's own browser than from the panel.
