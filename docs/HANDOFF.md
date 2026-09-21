# Handoff — continuing the Wire patch work on the show machine

Everything below is on branch `claude/wire-patch-api-content-gen-wovwud`.
This work started in a cloud session, which could not see local files or run
Resolume. On the laptop both become possible, which is what the open items need.

## Built and verified

- `tools/wire-gen/` — CLI. Keys per project from env vars, round-robin across
  projects at `concurrency`, per-slot model/size/length resolution, `--slots`,
  `--dry-run`. Verified end to end as a dry run; **never run against a real
  provider key yet**.
- `src/lib/wire/` — provider catalog, generation adapters (Google, OpenAI,
  fal.ai, Replicate, Luma), loop/fit/conform recipe builder. Runs in Node and
  in the browser.
- `src/pages/WirePatch.tsx` — optional browser console at `/wire`.
- `docs/WIRE_PATCH.md` — stage split, patch build recipe, OSC address, Wire
  Video Exporter settings.

Typecheck (`npm run lint`) and `npm run build` both pass.

## Open — needs the laptop

1. **Read a real `.wired`.** They are in `~/Documents/Wire/Patches`. Check
   whether the format is XML, JSON, zip or proprietary binary:
   `head -c 400 <file>.wired | xxd | head`. If it is text, `wire-gen` can emit
   a finished patch per slot with the resource path filled in. If it is binary,
   the hand-built patch in `docs/WIRE_PATCH.md` stays the workflow — say so
   rather than reverse-engineering it.
2. ~~Verify the ffmpeg conform pass.~~ **Done** — see "Verified" below. Still
   worth one run against real generated footage rather than a test pattern.
3. **Confirm the patch side in Wire 7.22+.** The video resource slot, and
   whether the node names in `docs/WIRE_PATCH.md` step 4 match the installed
   build. Correct the doc from what is actually there.
4. **Confirm the Video Exporter round trip** — DXV, normal, alpha on,
   1920×1080 — and that the result loops cleanly in Arena.

## Verified against real ffmpeg

`npm test` runs the conform pass through ffmpeg and checks the output, not the
command string. On ffmpeg 6.1.1 with a 5s 4:3 test pattern into a 1920×1080
canvas:

- duration comes out at exactly `clip - fadeSeconds` (135 frames @30fps),
- the output is ProRes 4444 `yuva444p12le`, alpha intact,
- fit padding measures alpha 0 (transparent), picture area 255,
- the loop wrap scores 19.9dB PSNR against the first frame, versus 20.5 and
  21.5 for ordinary frame steps and 17.2 for unrelated frames — i.e. the wrap
  is an ordinary frame step, not a cut. The loop is seamless.
- the still path holds for `stillDurationSeconds` with an alpha fade.

Note that ffmpeg 6.1.1 has **no `dxv` encoder at all**, which is the second
reason DXV3 comes from Wire's exporter rather than from here.

## Not yet proven

No generation adapter has been run against a live API. The request/response
shapes come from each provider's documented API, not from a successful call.
Run one cheap image clip per provider before trusting a batch, and fix the
adapters in `src/lib/wire/generate.ts` from the real responses.

## Local setup

```bash
git clone https://github.com/innsaeistudios/Innsaeistudios
cd Innsaeistudios && git checkout claude/wire-patch-api-content-gen-wovwud
npm install
cp wire.config.example.json wire.config.json      # gitignored; holds keys
export GOOGLE_API_KEY=... FAL_KEY=...
npm run wire -- --config wire.config.json --dry-run
```

Needs: Node, an ffmpeg with `prores_ks`, and Resolume 7.22+ with Wire.
