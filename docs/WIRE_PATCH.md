# AI Clip Patch — Resolume Wire

Prompt → generated clip → clip slot in Resolume, auto-looping with a fade and
alpha, exported to DXV3 at whatever size the screen is.

## What lives where

A Wire patch cannot call an API. Wire has OSC and MIDI nodes but no HTTP node,
no place to hold an API key, and no way to write a file. So the work splits:

| Stage | Where | Why |
| --- | --- | --- |
| API keys, prompt, model choice, generation | `wire-gen` CLI (`npm run wire`) | needs HTTPS + secrets |
| Seamless loop crossfade, fit into canvas, alpha | `wire-gen` ffmpeg pass | deterministic, batchable |
| Clip slot, playback, live loop/fade control | **Wire patch** | this document |
| DXV3 + alpha encode at final size | **Wire → Export Video** | Wire's own exporter writes DXV |

Resolume Alley has no command line, and ffmpeg's `dxv` encoder writes DXT1
only — no alpha. Wire's Video Exporter is the one path to DXV3 **with** alpha
that can be driven from a patch, which is why the patch is the last stop rather
than a detour.

## 1. Generate

```bash
cp wire.config.example.json wire.config.json   # then edit the clips list
export GOOGLE_API_KEY=... FAL_KEY=... OPENAI_API_KEY=...
npm run wire -- --config wire.config.json
```

Each clip lands in `resourcesDir` as a looping, canvas-fitted ProRes 4444 with
alpha intact: `01_slow_drifting_chrome_1920x1080_loop.mov`. The loop is already
seamless — the tail is cross-dissolved onto the head over `fadeSeconds`, so
Wire and Resolume can loop it with no visible cut.

Useful flags: `--slots 1,4,7` to regenerate a few, `--dry-run` to see which
project and model each clip would use without spending anything.

Multiple projects in `projects[]` are used round-robin, `concurrency` at a time,
so several accounts share the load instead of one key rate-limiting. Pin a clip
to one account with `"project": "club-openai"`.

## 2. Build the patch (once)

Requires **Resolume 7.22 or newer** — that is the release that added *resource
types*, which is what gives the patch a slot you can drop a video into.

1. New patch, set the patch size to your canvas (1920×1080, or the screen size).
2. Add a **video resource parameter**. This is the clip slot: it shows up as a
   file picker on the patch's parameter panel in Wire and in Resolume. Name it
   `Clip` so the OSC address below stays predictable.
3. Feed its texture output into the patch output.
4. Loop fade — the generated file already loops seamlessly, so this layer is for
   live control rather than hiding a cut:
   - a **Range/Phasor** driving playback position,
   - multiply the texture's alpha by a fade curve at the head and tail so you can
     ride the blend live from Resolume.
5. Expose as parameters: `Clip` (resource), `Fade` (0–2s), `Speed`, `Opacity`.
6. Save as `.wired`, and **File → Compile for Resolume** to put a `.cwired` in
   Arena's Sources folder. Compile with `--editable` if you want it reopenable.

> Node names differ slightly between Wire versions. If a node in step 4 isn't
> where this says, right-click any node in Wire to open its example patch —
> every node ships with one.

## 3. Play it

Drop the compiled source into a clip slot in Arena. Click the clip: it plays,
loops, and fades, with alpha over whatever is underneath. Point the `Clip`
parameter at a different file from `out/wire-resources/` to swap content without
touching the patch.

To have the CLI tell the patch when new material lands, turn on OSC in the
config:

```json
"osc": { "enabled": true, "host": "127.0.0.1", "port": 7000, "clipAddress": "/wire/clip" }
```

It sends `/wire/clip <slot:int> <absolute path:string>` after each clip
finishes. Route that to an **OSC In** node in the patch (or to Resolume's own
OSC input) to select the slot or reload the resource.

## 4. Export DXV3

In Wire: **File → Export Video**.

| Setting | Value |
| --- | --- |
| Codec | DXV |
| Quality | Normal |
| Alpha | On |
| Resolution | 1920 × 1080, or a custom size matching the screen |
| Frame rate | match the patch (60 by default here) |

Exports land as DXV3 `.mov`, ready to drop straight into Arena. Keep the source
material in `out/sources/` — re-running the ffmpeg pass at a different canvas
size costs nothing, where re-generating costs an API call.

## Still open

The `.wired` format isn't publicly documented, so the patch above is built by
hand once rather than generated. Drop a saved `.wired` into `docs/samples/` and
the build step can be automated — `wire-gen` would then write one patch per
slot with the resource path already filled in.
