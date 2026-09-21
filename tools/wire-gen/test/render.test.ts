/**
 * The conform pass is the part that silently produces wrong-looking clips, so
 * these run real ffmpeg and check the output rather than the command string.
 * Skipped automatically where ffmpeg is missing.
 */

import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildRenderJob, encoderArgs, RESOLUME_PRESET } from "../../../src/lib/wire/render";

const hasFfmpeg = spawnSync("ffmpeg", ["-version"]).status === 0;

function run(bin: string, args: string[]): Promise<string> {
  return new Promise((ok, fail) => {
    const child = spawn(bin, args);
    let out = "";
    child.stdout.on("data", (d) => { out += d; });
    child.stderr.on("data", (d) => { out += d; });
    child.on("close", (code) => (code === 0 ? ok(out) : fail(new Error(out.split("\n").slice(-10).join("\n")))));
  });
}

const probe = async (file: string, entries: string) =>
  (await run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", entries, "-of", "default=nw=1:nk=1", file])).trim();

/** PSNR between two frame numbers of the same file. Higher = more alike. */
async function framePsnr(dir: string, file: string, a: number, b: number): Promise<number> {
  for (const [n, name] of [[a, "a.png"], [b, "b.png"]] as const) {
    await run("ffmpeg", ["-v", "error", "-y", "-i", file, "-vf", `select=eq(n\\,${n})`, "-frames:v", "1", join(dir, name)]);
  }
  const out = await run("ffmpeg", ["-i", join(dir, "a.png"), "-i", join(dir, "b.png"), "-lavfi", "psnr", "-f", "null", "-"]);
  const match = out.match(/average:([0-9.]+)/);
  assert.ok(match, "psnr did not report an average");
  return Number(match[1]);
}

describe("conform pass", { skip: hasFfmpeg ? false : "ffmpeg not installed" }, () => {
  let dir = "";
  // 4:3 source into a 16:9 canvas, so the fit padding is exercised.
  const settings = { ...RESOLUME_PRESET, fps: 30, fadeSeconds: 0.5 };
  const clipSeconds = 5;

  before(async () => {
    dir = await mkdtemp(join(tmpdir(), "wire-conform-"));
    await run("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i",
      `testsrc2=size=640x480:rate=${settings.fps}:duration=${clipSeconds}`, "-pix_fmt", "yuv420p", join(dir, "src.mp4")]);
  });
  after(async () => { if (dir) await rm(dir, { recursive: true, force: true }); });

  const conform = async (modality: "video" | "image", input: string) => {
    const job = buildRenderJob({
      id: "t", slot: 1, label: "test", modality, input,
      durationSeconds: clipSeconds,
    }, settings);
    const out = join(dir, job.output);
    await run("ffmpeg", [
      "-y", "-v", "error",
      ...(modality === "image" ? ["-loop", "1"] : []),
      "-i", input, "-filter_complex", job.filterGraph, "-map", "[out]",
      ...encoderArgs(settings), "-an", out,
    ]);
    return out;
  };

  test("trims exactly one crossfade off the duration", async () => {
    const out = await conform("video", join(dir, "src.mp4"));
    const frames = Number(await probe(out, "stream=nb_frames"));
    assert.equal(frames, (clipSeconds - settings.fadeSeconds) * settings.fps);
  });

  test("keeps an alpha channel, and the fit padding is transparent", async () => {
    const out = await conform("video", join(dir, "src.mp4"));
    assert.match(await probe(out, "stream=pix_fmt"), /^yuva/);

    // Raw bytes, not text — decoding this as UTF-8 turns 255 into U+FFFD.
    const alphaAt = (x: number): number => execFileSync("ffmpeg", ["-v", "error", "-i", out, "-vf",
      `alphaextract,crop=1:1:${x}:540,format=gray`, "-frames:v", "1", "-f", "rawvideo", "-"])[0];
    // 640x480 fitted into 1920x1080 leaves 240px bars either side.
    assert.equal(alphaAt(50), 0, "pillarbox should be fully transparent");
    assert.equal(alphaAt(960), 255, "picture area should be opaque");
  });

  test("wraps seamlessly — the loop point is an ordinary frame step", async () => {
    const out = await conform("video", join(dir, "src.mp4"));
    const last = Number(await probe(out, "stream=nb_frames")) - 1;

    const wrap = await framePsnr(dir, out, last, 0);
    const ordinary = await framePsnr(dir, out, last - 1, last);
    const unrelated = await framePsnr(dir, out, 60, 0);

    // The wrap should look like any other step, not like a cut to a new shot.
    assert.ok(wrap > unrelated + 1.5, `wrap ${wrap} should beat unrelated frames ${unrelated}`);
    assert.ok(wrap > ordinary - 2, `wrap ${wrap} should be close to an ordinary step ${ordinary}`);
  });

  test("holds a still for the configured duration with an alpha fade", async () => {
    await run("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", `testsrc2=size=640x480:rate=${settings.fps}`,
      "-frames:v", "1", join(dir, "src.png")]);
    const out = await conform("image", join(dir, "src.png"));
    assert.equal(Number(await probe(out, "stream=nb_frames")), settings.stillDurationSeconds * settings.fps);
    assert.match(await probe(out, "stream=pix_fmt"), /^yuva/);
  });
});
