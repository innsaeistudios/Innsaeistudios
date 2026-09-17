<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/c8807d0c-5d2d-401b-9fb4-d8a2ec063680

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Innsaei Communication (Resolume Arena)

WhatsApp inside Arena: each contact and group opens like a source folder, with
every message, reply and file captured underneath it, and any capture can be
dragged straight onto a clip slot.

```bash
npm run bridge   # capture service + local library (mock data by default)
npm run dev      # panel; add http://127.0.0.1:3000/panel as a Web Page source in Arena
```

- Panel and drag-to-clip behaviour: `wire/README.md`
- Bridge, providers, pairing a real account and the API: `bridge/README.md`
- Hosted page with setup notes: `/communication`
