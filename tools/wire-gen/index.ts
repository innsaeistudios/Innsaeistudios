#!/usr/bin/env tsx
/**
 * wire-gen — generate clips from your own API keys and conform them into the
 * looping, canvas-fitted files a Resolume Wire patch loads in its video
 * resource slot.
 *
 *   npm run wire -- --config wire.config.json
 *   npm run wire -- --config wire.config.json --slots 1,4,7 --dry-run
 *
 * What it does NOT do: write DXV3. Wire's Video Exporter does that, with alpha,
 * quality and canvas size, straight out of the patch. This gets the material
 * into the patch looking right.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { basename, join, resolve } from "node:path";
import { generate } from "../../src/lib/wire/generate";
import { getProvider, modelsFor } from "../../src/lib/wire/providers";
import { buildRenderJob, encoderArgs } from "../../src/lib/wire/render";
import type { ApiProject } from "../../src/lib/wire/keyVault";
import { loadConfig, type ClipRequest, type ResolvedConfig } from "./config";
import { sendOsc } from "./osc";

interface Args { config: string; slots?: number[]; dryRun: boolean }

function parseArgs(argv: string[]): Args {
  const args: Args = { config: "wire.config.json", dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--config" || argv[i] === "-c") args.config = argv[++i];
    else if (argv[i] === "--slots") args.slots = argv[++i].split(",").map((n) => Number(n.trim()));
    else if (argv[i] === "--dry-run") args.dryRun = true;
  }
  return args;
}

const log = (slot: number, message: string) =>
  console.log(`  [${String(slot).padStart(2, "0")}] ${message}`);

function run(bin: string, args: string[]): Promise<void> {
  return new Promise((done, fail) => {
    const child = spawn(bin, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", fail);
    child.on("close", (code) => (code === 0 ? done() : fail(new Error(stderr.trim().split("\n").slice(-4).join("\n")))));
  });
}

/** Fills in whichever of model/size/duration the clip left unspecified. */
function resolveClip(clip: ClipRequest, project: ApiProject): Required<Pick<ClipRequest, "model" | "size" | "duration">> {
  const models = modelsFor(project.providerId, clip.modality);
  const model = models.find((m) => m.id === clip.model) ?? models[0];
  if (!model) {
    throw new Error(`${getProvider(project.providerId)?.label ?? project.providerId} has no ${clip.modality} model`);
  }
  return {
    model: model.id,
    size: model.sizes.includes(clip.size ?? "") ? clip.size! : model.sizes[0],
    duration: model.durations?.includes(clip.duration ?? 0) ? clip.duration! : model.durations?.[0] ?? 5,
  };
}

async function processClip(clip: ClipRequest, project: ApiProject, config: ResolvedConfig, dryRun: boolean): Promise<void> {
  const spec = resolveClip(clip, project);
  const ext = clip.modality === "video" ? "mp4" : "png";
  const sourcePath = join(config.sourcesDir, `${String(clip.slot).padStart(2, "0")}_source.${ext}`);

  log(clip.slot, `${project.name} · ${spec.model} · ${spec.size}${clip.modality === "video" ? ` · ${spec.duration}s` : ""}`);
  if (dryRun) return;

  const asset = await generate({
    project,
    modelId: spec.model,
    modality: clip.modality,
    prompt: clip.prompt,
    size: spec.size,
    duration: spec.duration,
    alpha: config.render.alpha,
    onProgress: (note) => log(clip.slot, note),
  });

  if (asset.bytes) {
    await writeFile(sourcePath, asset.bytes);
  } else if (asset.remoteUrl) {
    const res = await fetch(asset.remoteUrl);
    if (!res.ok) throw new Error(`could not download result: ${res.status}`);
    await writeFile(sourcePath, new Uint8Array(await res.arrayBuffer()));
  } else {
    throw new Error("provider returned nothing to save");
  }
  log(clip.slot, `source → ${basename(sourcePath)}`);

  if (!config.ffmpegPath) return;

  const job = buildRenderJob({
    id: `slot_${clip.slot}`,
    slot: clip.slot,
    label: clip.prompt.slice(0, 40),
    modality: clip.modality,
    input: sourcePath,
    durationSeconds: spec.duration,
  }, config.render);

  const outPath = join(config.resourcesDir, job.output);
  const ffmpegArgs = [
    "-y",
    ...(clip.modality === "image" ? ["-loop", "1"] : []),
    "-i", sourcePath,
    "-filter_complex", job.filterGraph,
    "-map", "[out]",
    ...encoderArgs(config.render),
    "-an", outPath,
  ];
  await run(config.ffmpegPath, ffmpegArgs);
  log(clip.slot, `loop → ${job.output}`);

  if (config.osc?.enabled) {
    await sendOsc(config.osc, config.osc.clipAddress, [clip.slot, resolve(outPath)]);
    log(clip.slot, `osc → ${config.osc.clipAddress} ${clip.slot}`);
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const config = await loadConfig(args.config);

  const clips = args.slots ? config.clips.filter((c) => args.slots!.includes(c.slot)) : config.clips;
  if (!clips.length) throw new Error("no clips matched --slots");

  await mkdir(config.sourcesDir, { recursive: true });
  await mkdir(config.resourcesDir, { recursive: true });

  const pool = config.projects.filter((p) => !p.disabled);
  const r = config.render;
  console.log(
    `wire-gen · ${clips.length} clip(s) · ${pool.length} project(s) · ${config.concurrency} at a time\n` +
    `           ${r.width}×${r.height} ${r.scaleMode} · ${r.fps}fps · ${r.fadeSeconds}s loop fade` +
    `${r.alpha ? " · alpha" : ""}\n`,
  );

  // Round-robin across projects so several accounts share the load, then run a
  // fixed number of lanes over the queue.
  const queue = clips.map((clip, i) => ({
    clip,
    project: pool.find((p) => p.name === clip.project) ?? pool[i % pool.length],
  }));

  const failures: { slot: number; error: string }[] = [];
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(config.concurrency, queue.length) }, async () => {
      while (cursor < queue.length) {
        const { clip, project } = queue[cursor++];
        try {
          await processClip(clip, project, config, args.dryRun);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          failures.push({ slot: clip.slot, error: message });
          log(clip.slot, `FAILED — ${message}`);
        }
      }
    }),
  );

  console.log(`\n${clips.length - failures.length}/${clips.length} clip(s) ready in ${config.resourcesDir}`);
  if (failures.length) {
    console.log("failed: " + failures.map((f) => `slot ${f.slot}`).join(", "));
    process.exitCode = 1;
    return;
  }
  console.log(
    "\nNext: open the patch in Wire, point each slot's video resource at these files,\n" +
    `then File → Export Video with codec DXV, quality ${config.render.quality}` +
    `${config.render.alpha ? " and alpha on" : ""}, ${config.render.width}×${config.render.height} @ ${config.render.fps}fps.`,
  );
}

main().catch((err) => {
  console.error(`wire-gen: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
