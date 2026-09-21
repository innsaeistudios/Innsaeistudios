/**
 * Conform stage: turn a raw generation into the looping, canvas-fitted clip
 * that a Wire patch's resource slot loads.
 *
 * DXV3 itself is written by Wire's own Video Exporter (codec DXV, quality
 * normal/high, with or without alpha, any resolution) — nothing here or in a
 * browser encodes DXV. So the default target is a ProRes 4444 intermediate
 * that carries alpha losslessly into Wire. "dxv3" stays available for the case
 * where you are skipping Wire and have an ffmpeg build with the dxv encoder,
 * which currently writes DXT1 only and therefore drops alpha.
 */

import type { Modality } from "./providers";

export interface RenderSettings {
  /** Canvas the clip is fitted into. */
  width: number;
  height: number;
  /** "fit" letterboxes into transparency; "fill" crops to cover. */
  scaleMode: "fit" | "fill";
  fps: number;
  /** Crossfade length in seconds that makes the loop seamless. */
  fadeSeconds: number;
  /** Still images are held for this long before looping. */
  stillDurationSeconds: number;
  alpha: boolean;
  quality: "normal" | "high";
  /**
   * "prores4444" — alpha-safe intermediate for the Wire resource slot (default).
   * "dxv3" — direct ffmpeg dxv encode; no alpha, needs a dxv-capable build.
   */
  codec: "prores4444" | "dxv3";
}

export const RESOLUME_PRESET: RenderSettings = {
  width: 1920,
  height: 1080,
  scaleMode: "fit",
  fps: 60,
  fadeSeconds: 0.5,
  stillDurationSeconds: 4,
  alpha: true,
  quality: "normal",
  codec: "prores4444",
};

/** Common house sizes, plus whatever screen the room actually has. */
export const SIZE_PRESETS: { label: string; width: number; height: number }[] = [
  { label: "1920 × 1080 (HD)", width: 1920, height: 1080 },
  { label: "3840 × 2160 (4K)", width: 3840, height: 2160 },
  { label: "1080 × 1920 (vertical)", width: 1080, height: 1920 },
  { label: "2560 × 720 (wide LED)", width: 2560, height: 720 },
  { label: "1024 × 768 (4:3 panel)", width: 1024, height: 768 },
];

export interface RenderJob {
  clipId: string;
  slot: number;
  label: string;
  modality: Modality;
  /** Remote URL when the provider gave one, otherwise the local file name to drop next to the script. */
  input: string;
  output: string;
  settings: RenderSettings;
  filterGraph: string;
  command: string;
}

function scaleChain(s: RenderSettings): string {
  const pad = s.alpha ? "black@0.0" : "black";
  return s.scaleMode === "fit"
    ? `scale=${s.width}:${s.height}:force_original_aspect_ratio=decrease,` +
      `pad=${s.width}:${s.height}:(ow-iw)/2:(oh-ih)/2:color=${pad}`
    : `scale=${s.width}:${s.height}:force_original_aspect_ratio=increase,crop=${s.width}:${s.height}`;
}

/**
 * Seamless loop for a moving clip: the last `fade` seconds are cross-dissolved
 * onto the first `fade` seconds, so the end of the file already matches its
 * own start and Resolume's loop point is invisible.
 */
export function buildVideoFilterGraph(s: RenderSettings, clipSeconds: number): string {
  const f = Math.min(s.fadeSeconds, Math.max(0.1, clipSeconds / 3));
  const body = (clipSeconds - f).toFixed(3);
  const fade = f.toFixed(3);
  const pre = `${scaleChain(s)},format=${s.alpha ? "rgba" : "yuv420p"},fps=${s.fps}`;
  return [
    `[0:v]${pre},split=2[a][b]`,
    `[a]trim=0:${body},setpts=PTS-STARTPTS,split=2[m1][m2]`,
    `[b]trim=${body}:${clipSeconds.toFixed(3)},setpts=PTS-STARTPTS[tail]`,
    `[m1]trim=0:${fade},setpts=PTS-STARTPTS[head]`,
    `[tail][head]blend=all_expr='A*(1-T/${fade})+B*(T/${fade})'[mix]`,
    `[m2]trim=${fade}:${body},setpts=PTS-STARTPTS[rest]`,
    `[mix][rest]concat=n=2:v=1:a=0[out]`,
  ].join(";");
}

/**
 * Stills get an alpha breathe instead: fade up at the head, down at the tail,
 * over the same duration, which loops on itself without a visible cut.
 */
export function buildStillFilterGraph(s: RenderSettings): string {
  const d = s.stillDurationSeconds;
  const f = Math.min(s.fadeSeconds, d / 3);
  return (
    `[0:v]${scaleChain(s)},format=rgba,fps=${s.fps},` +
    `loop=loop=-1:size=1:start=0,trim=duration=${d.toFixed(3)},setpts=PTS-STARTPTS,` +
    `fade=t=in:st=0:d=${f.toFixed(3)}:alpha=1,` +
    `fade=t=out:st=${(d - f).toFixed(3)}:d=${f.toFixed(3)}:alpha=1[out]`
  );
}

/** Encoder flags as argv, for spawning ffmpeg directly. */
export function encoderArgs(s: RenderSettings): string[] {
  return codecFlags(s).split(" ").filter(Boolean);
}

function codecFlags(s: RenderSettings): string {
  if (s.codec === "dxv3") {
    // ffmpeg's dxv encoder is DXT1 only today — opaque. Real DXV3 + alpha comes
    // out of Wire's Video Exporter instead.
    return `-c:v dxv -pix_fmt rgb0 -r ${s.fps}`;
  }
  // ProRes 4444 (profile 4) keeps the alpha channel intact for Wire to read.
  return `-c:v prores_ks -profile:v ${s.alpha ? 4 : 3} -pix_fmt ${s.alpha ? "yuva444p10le" : "yuv422p10le"} ` +
    `-quant_mat ${s.quality === "high" ? "hq" : "auto"} -alpha_bits ${s.alpha ? 16 : 0} -r ${s.fps}`;
}

function safeName(label: string): string {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "clip";
}

export function buildRenderJob(clip: {
  id: string;
  slot: number;
  label: string;
  modality: Modality;
  input: string;
  durationSeconds?: number;
}, settings: RenderSettings): RenderJob {
  const isVideo = clip.modality === "video";
  const filterGraph = isVideo
    ? buildVideoFilterGraph(settings, clip.durationSeconds ?? 5)
    : buildStillFilterGraph(settings);
  const suffix = settings.codec === "dxv3" ? "dxv3" : "loop";
  const output = `${String(clip.slot).padStart(2, "0")}_${safeName(clip.label)}_${settings.width}x${settings.height}_${suffix}.mov`;
  const loopIn = isVideo ? "" : "-loop 1 ";
  const command =
    `ffmpeg -y ${loopIn}-i "${clip.input}" ` +
    `-filter_complex "${filterGraph}" -map "[out]" ` +
    `${codecFlags(settings)} -an "${output}"`;

  return { clipId: clip.id, slot: clip.slot, label: clip.label, modality: clip.modality, input: clip.input, output, settings, filterGraph, command };
}

/** A shell script an operator (or a render worker) can run unchanged. */
export function buildBatchScript(jobs: RenderJob[]): string {
  return [
    "#!/usr/bin/env bash",
    "# Innsaei Wire Patch — conform generated clips into Wire resource slots",
    "# Output is a looping, canvas-fitted ProRes 4444 (alpha kept). Load it into the",
    "# patch's video resource slot, then export DXV3 from Wire's Video Exporter.",
    "set -euo pipefail",
    "",
    ...jobs.flatMap((j) => [`# slot ${j.slot} — ${j.label}`, j.command, ""]),
    `echo "rendered ${jobs.length} clip(s)"`,
    "",
  ].join("\n");
}

export function buildManifest(jobs: RenderJob[]): string {
  return JSON.stringify(
    {
      generator: "innsaei-wire-patch",
      createdAt: new Date().toISOString(),
      clips: jobs.map((j) => ({
        slot: j.slot,
        label: j.label,
        modality: j.modality,
        input: j.input,
        output: j.output,
        loop: { seamless: true, fadeSeconds: j.settings.fadeSeconds },
        canvas: { width: j.settings.width, height: j.settings.height, scaleMode: j.settings.scaleMode },
        codec: { name: j.settings.codec, alpha: j.settings.alpha, quality: j.settings.quality, fps: j.settings.fps },
        wireExport: {
          codec: "DXV",
          quality: j.settings.quality,
          alpha: j.settings.alpha,
          width: j.settings.width,
          height: j.settings.height,
          fps: j.settings.fps,
        },
        command: j.command,
      })),
    },
    null,
    2,
  );
}
