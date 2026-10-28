# Wire layout: audio-reactive club environment

How to build the Resolume Wire patch around the meshes exported by
`build_and_export.py`. Node names follow Resolume Wire 7.x. If your build
labels a node differently, search the node browser for the keyword in
brackets.

## 0. Export

```
blender --background --python build_and_export.py -- --out ./export
```

You get `Rings.obj  Pillars.obj  Crystals.obj  Floor.obj  Core.obj  Dome.obj`
plus `club_environment.glb` (preview) and `.blend`.

## 1. Audio front end (build once, reuse everywhere)

```
[Audio Input / FFT] ─┬─► [Band 20-120 Hz] ──► [Smooth  attack 0.02 / release 0.25] ──► LOW
                     ├─► [Band 120-2k Hz] ──► [Smooth  attack 0.05 / release 0.40] ──► MID
                     ├─► [Band 2k-12k Hz] ──► [Smooth  attack 0.01 / release 0.15] ──► HIGH
                     └─► [Level / RMS]    ──► [Smooth  attack 0.50 / release 2.00] ──► ENERGY
LOW ──► [Threshold 0.6] ──► [Trigger / Onset] ──► KICK   (one-shot events)
```

Multiply each band by a published **Reactivity** input (0-2) before it fans
out, so you can tame the whole scene from Resolume in a quiet room.

Tip: keep the fast attack / slow release ratio. That is what makes motion
"punch and breathe" instead of flicker.

## 2. Scene graph

```
                     ┌───────────────────────────────────────────────┐
[Mesh: Rings.obj] ───►[Transform] scale = 1 + LOW*0.15                │
[Mesh: Pillars.obj] ─►[Transform] scale Z = 1 + LOW*0.4               │
[Mesh: Crystals.obj]►[Transform] rot Y += HIGH*8 deg/frame            ├─►[Render 3D]─►[Bloom]─►[Output]
[Mesh: Floor.obj] ──►[Material]  emission = 0.3 + MID*2               │      ▲
[Mesh: Core.obj] ───►[Transform] scale = 1 + ENERGY*0.6, KICK flash   │      │
[Mesh: Dome.obj] ───►(static)                                         │  [Camera]
                     └───────────────────────────────────────────────┘
```

Each mesh's material colour is fed by one shared **Hue** value:

```
ENERGY ──► [Lerp hue A → hue B] ──► [HSV to RGB] ──► every Material colour
```

Calm sections stay in the blue/violet range and drops shift to magenta/gold.

## 3. Camera

```
[Time] ──► [Sin] ─► camera X = sin(t*0.1)*1.5      (slow drift)
MID    ──► [Accumulate] ─► camera Y fly-through, wrap at -40
KICK   ──► [Envelope 80 ms] ─► FOV - 6°            (punch-in on each kick)
```

To make the tunnel look endless, wrap camera Y to 0 when it passes the
last ring (`-ring_count * spacing`, which is -48 by default).

## 4. Published parameters (what shows on the clip in Resolume)

| Published input | Range | Default | Drives |
|---|---|---|---|
| Reactivity | 0-2 | 1.0 | gain on all audio bands |
| Kick Punch | 0-1 | 0.6 | FOV punch + core flash |
| Fly Speed | 0-3 | 1.0 | camera travel speed |
| Hue A / Hue B | 0-1 | 0.62 / 0.9 | colour palette |
| Bloom | 0-1 | 0.5 | glow amount |
| Crystal Spin | 0-2 | 1.0 | high-band spin gain |

Each of these can also be linked to MIDI or to Resolume's own audio analysis
on the clip, so you have two layers of reactivity.

## 5. Load into Resolume

1. Save the patch as a **Source**, e.g. `Innsaei_ClubTunnel`. Keep the
   `export/` folder next to it, or use absolute paths in the mesh nodes.
2. In Arena: **Sources → Wire → Innsaei_ClubTunnel**, then drag it into a
   clip slot. The full environment renders inside the slot.
3. In Preferences → Audio, pick the mic or line input. If the patch
   uses Resolume's audio input rather than its own device node, set the
   composition audio input to that device as well.

## Performance notes

- Set the render size in Wire to your composition size (e.g. 1920x1080).
- If frames drop, lower `SEED_RINGS` / `GRID_SIZE` in the script and
  re-export. The floor grid is the heaviest mesh.
- Bloom is cheaper in Wire than as a Resolume clip effect.
