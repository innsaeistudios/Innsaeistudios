/**
 * Render stage: turn a generated clip into a Resolume-ready DXV3 loop.
 *
 * A browser cannot encode DXV, so this builds the exact recipe instead — an
 * ffmpeg command per clip plus a batch manifest an Alley / worker run can
 * consume. The filter graph does the auto-loop crossfade, the alpha-safe fit
 * into the target canvas, and nothing else.
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
  codec: "dxv3";
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
  codec: "dxv3",
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

function codecFlags(s: RenderSettings): string {
  // ffmpeg's dxv encoder: dxt5 carries alpha, dxt5-ycocg is the higher-quality
  // opaque variant Resolume calls "DXV3 normal / high".
  const format = s.alpha ? "dxt5" : s.quality === "high" ? "dxt5-ycocg" : "dxt1";
  return `-c:v dxv -format ${format} -pix_fmt ${s.alpha ? "rgba" : "yuva420p"} -r ${s.fps}`;
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
  const output = `${String(clip.slot).padStart(2, "0")}_${safeName(clip.label)}_${settings.width}x${settings.height}_dxv3.mov`;
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
    "# Innsaei Wire Patch — DXV3 batch render",
    "# Requires an ffmpeg build with the dxv encoder (resolume.com/download/alley for DXV3 Pro).",
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
        codec: { name: "DXV3", alpha: j.settings.alpha, quality: j.settings.quality, fps: j.settings.fps },
        command: j.command,
      })),
    },
    null,
    2,
  );
}

export function downloadText(filename: string, contents: string, mime = "text/plain"): void {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
