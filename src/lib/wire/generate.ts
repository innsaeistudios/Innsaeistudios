/**
 * Generation runner. One adapter per provider, all reduced to the same shape:
 * submit a job, then (for the async video endpoints) poll until an asset URL
 * comes back.
 */

import type { ApiProject } from "./keyVault";
import { getModel, type Modality } from "./providers";

export interface GenerateRequest {
  project: ApiProject;
  modelId: string;
  modality: Modality;
  prompt: string;
  /** Provider-native size / aspect token, taken from the model spec. */
  size: string;
  /** Seconds. Video only. */
  duration?: number;
  /** Ask the provider for a transparent background where it supports one. */
  alpha?: boolean;
  signal?: AbortSignal;
  onProgress?: (note: string) => void;
}

export interface GeneratedAsset {
  mime: string;
  modality: Modality;
  /** Set when the provider hands back a URL we can hand straight to Wire / a player. */
  remoteUrl?: string;
  /** Set when the provider returned the file itself. Written to disk by the CLI. */
  bytes?: Uint8Array;
}

/** Browser helper: something an <img>/<video> can point at. */
export function assetObjectUrl(asset: GeneratedAsset): string {
  if (asset.remoteUrl) return asset.remoteUrl;
  if (asset.bytes) return URL.createObjectURL(new Blob([asset.bytes as BlobPart], { type: asset.mime }));
  throw new Error("asset has neither bytes nor a url");
}

class GenerationError extends Error {}

function endpoint(project: ApiProject, base: string, path: string): string {
  return project.proxyBase ? `${project.proxyBase.replace(/\/$/, "")}${path}` : `${base}${path}`;
}

async function readError(res: Response): Promise<never> {
  let detail = res.statusText;
  try {
    const body = await res.text();
    if (body) detail = body.slice(0, 400);
  } catch {
    /* keep statusText */
  }
  throw new GenerationError(`${res.status} ${detail}`);
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new GenerationError("cancelled"));
    }, { once: true });
  });
}

async function poll<T>(
  fn: () => Promise<{ done: boolean; value?: T }>,
  { intervalMs = 5000, timeoutMs = 10 * 60 * 1000, signal, onProgress }: {
    intervalMs?: number; timeoutMs?: number; signal?: AbortSignal; onProgress?: (n: string) => void;
  },
): Promise<T> {
  const started = Date.now();
  for (let tick = 1; ; tick++) {
    const { done, value } = await fn();
    if (done && value !== undefined) return value;
    if (Date.now() - started > timeoutMs) throw new GenerationError("timed out waiting for the provider");
    onProgress?.(`rendering on provider — poll ${tick}`);
    await sleep(intervalMs, signal);
  }
}

function decodeBase64(b64: string): Uint8Array {
  const binary = typeof atob === "function"
    ? atob(b64)
    : Buffer.from(b64, "base64").toString("binary");
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function bodyBytes(res: Response): Promise<Uint8Array> {
  return new Uint8Array(await res.arrayBuffer());
}

/* ------------------------------------------------------------------ Google */

async function google(req: GenerateRequest): Promise<GeneratedAsset> {
  const base = "https://generativelanguage.googleapis.com";
  const key = req.project.apiKey;
  const headers = { "content-type": "application/json", "x-goog-api-key": key };

  if (req.modality === "image") {
    const res = await fetch(endpoint(req.project, base, `/v1beta/models/${req.modelId}:predict`), {
      method: "POST",
      headers,
      signal: req.signal,
      body: JSON.stringify({
        instances: [{ prompt: req.prompt }],
        parameters: { sampleCount: 1, aspectRatio: req.size },
      }),
    });
    if (!res.ok) await readError(res);
    const json = await res.json();
    const b64 = json?.predictions?.[0]?.bytesBase64Encoded;
    if (!b64) throw new GenerationError("no image in response");
    return { bytes: decodeBase64(b64), mime: "image/png", modality: "image" };
  }

  const start = await fetch(endpoint(req.project, base, `/v1beta/models/${req.modelId}:predictLongRunning`), {
    method: "POST",
    headers,
    signal: req.signal,
    body: JSON.stringify({
      instances: [{ prompt: req.prompt }],
      parameters: { aspectRatio: req.size, durationSeconds: req.duration ?? 8 },
    }),
  });
  if (!start.ok) await readError(start);
  const { name } = await start.json();
  if (!name) throw new GenerationError("no operation name in response");

  const uri = await poll<string>(async () => {
    const res = await fetch(endpoint(req.project, base, `/v1beta/${name}`), { headers, signal: req.signal });
    if (!res.ok) await readError(res);
    const op = await res.json();
    if (op.error) throw new GenerationError(op.error.message ?? "operation failed");
    if (!op.done) return { done: false };
    const video = op.response?.generateVideoResponse?.generatedSamples?.[0]?.video
      ?? op.response?.generatedVideos?.[0]?.video;
    return { done: true, value: video?.uri };
  }, { signal: req.signal, onProgress: req.onProgress });

  if (!uri) throw new GenerationError("no video in response");
  // The file endpoint needs the key too; fetch it so the slot can play it back.
  const file = await fetch(`${uri}${uri.includes("?") ? "&" : "?"}key=${encodeURIComponent(key)}`, { signal: req.signal });
  if (!file.ok) await readError(file);
  return { bytes: await bodyBytes(file), mime: file.headers.get("content-type") ?? "video/mp4", modality: "video" };
}

/* ------------------------------------------------------------------ OpenAI */

async function openai(req: GenerateRequest): Promise<GeneratedAsset> {
  const base = "https://api.openai.com";
  const auth = { authorization: `Bearer ${req.project.apiKey}` };

  if (req.modality === "image") {
    const res = await fetch(endpoint(req.project, base, "/v1/images/generations"), {
      method: "POST",
      headers: { ...auth, "content-type": "application/json" },
      signal: req.signal,
      body: JSON.stringify({
        model: req.modelId,
        prompt: req.prompt,
        size: req.size,
        n: 1,
        ...(req.alpha ? { background: "transparent", output_format: "png" } : {}),
      }),
    });
    if (!res.ok) await readError(res);
    const json = await res.json();
    const item = json?.data?.[0];
    if (item?.b64_json) return { bytes: decodeBase64(item.b64_json), mime: "image/png", modality: "image" };
    if (item?.url) return { remoteUrl: item.url, mime: "image/png", modality: "image" };
    throw new GenerationError("no image in response");
  }

  const form = new FormData();
  form.set("model", req.modelId);
  form.set("prompt", req.prompt);
  form.set("size", req.size);
  form.set("seconds", String(req.duration ?? 4));
  const start = await fetch(endpoint(req.project, base, "/v1/videos"), {
    method: "POST", headers: auth, body: form, signal: req.signal,
  });
  if (!start.ok) await readError(start);
  const job = await start.json();
  if (!job?.id) throw new GenerationError("no video job id in response");

  await poll<boolean>(async () => {
    const res = await fetch(endpoint(req.project, base, `/v1/videos/${job.id}`), { headers: auth, signal: req.signal });
    if (!res.ok) await readError(res);
    const status = await res.json();
    if (status.status === "failed") throw new GenerationError(status.error?.message ?? "video job failed");
    return { done: status.status === "completed", value: true };
  }, { signal: req.signal, onProgress: req.onProgress });

  const content = await fetch(endpoint(req.project, base, `/v1/videos/${job.id}/content`), { headers: auth, signal: req.signal });
  if (!content.ok) await readError(content);
  return { bytes: await bodyBytes(content), mime: content.headers.get("content-type") ?? "video/mp4", modality: "video" };
}

/* --------------------------------------------------------------------- fal */

async function fal(req: GenerateRequest): Promise<GeneratedAsset> {
  const base = "https://queue.fal.run";
  const headers = { authorization: `Key ${req.project.apiKey}`, "content-type": "application/json" };
  const input: Record<string, unknown> = { prompt: req.prompt };
  if (req.modality === "image") input.image_size = req.size;
  else {
    input.aspect_ratio = req.size;
    input.duration = String(req.duration ?? 5);
  }

  const start = await fetch(endpoint(req.project, base, `/${req.modelId}`), {
    method: "POST", headers, signal: req.signal, body: JSON.stringify(input),
  });
  if (!start.ok) await readError(start);
  const queued = await start.json();
  const statusUrl: string | undefined = queued.status_url;
  const responseUrl: string | undefined = queued.response_url;
  if (!statusUrl || !responseUrl) throw new GenerationError("no queue handles in response");

  await poll<boolean>(async () => {
    const res = await fetch(statusUrl, { headers, signal: req.signal });
    if (!res.ok) await readError(res);
    const status = await res.json();
    if (status.status === "ERROR") throw new GenerationError("fal job failed");
    return { done: status.status === "COMPLETED", value: true };
  }, { signal: req.signal, onProgress: req.onProgress });

  const res = await fetch(responseUrl, { headers, signal: req.signal });
  if (!res.ok) await readError(res);
  const out = await res.json();
  const url: string | undefined = out?.images?.[0]?.url ?? out?.video?.url ?? out?.image?.url;
  if (!url) throw new GenerationError("no asset in response");
  return {
    remoteUrl: url,
    mime: req.modality === "image" ? "image/png" : "video/mp4",
    modality: req.modality,
  };
}

/* --------------------------------------------------------------- Replicate */

async function replicate(req: GenerateRequest): Promise<GeneratedAsset> {
  const base = "https://api.replicate.com";
  const headers = { authorization: `Bearer ${req.project.apiKey}`, "content-type": "application/json" };
  const input: Record<string, unknown> = { prompt: req.prompt, aspect_ratio: req.size };
  if (req.modality === "video") input.duration = req.duration ?? 5;

  const start = await fetch(endpoint(req.project, base, `/v1/models/${req.modelId}/predictions`), {
    method: "POST", headers, signal: req.signal, body: JSON.stringify({ input }),
  });
  if (!start.ok) await readError(start);
  const prediction = await start.json();
  const getUrl: string = prediction?.urls?.get ?? endpoint(req.project, base, `/v1/predictions/${prediction.id}`);

  const output = await poll<unknown>(async () => {
    const res = await fetch(getUrl, { headers, signal: req.signal });
    if (!res.ok) await readError(res);
    const status = await res.json();
    if (status.status === "failed" || status.status === "canceled") {
      throw new GenerationError(status.error ?? "prediction failed");
    }
    return { done: status.status === "succeeded", value: status.output };
  }, { signal: req.signal, onProgress: req.onProgress });

  const url = Array.isArray(output) ? (output[0] as string) : (output as string);
  if (typeof url !== "string") throw new GenerationError("no asset in response");
  return {
    remoteUrl: url,
    mime: req.modality === "image" ? "image/png" : "video/mp4",
    modality: req.modality,
  };
}

/* -------------------------------------------------------------------- Luma */

async function luma(req: GenerateRequest): Promise<GeneratedAsset> {
  const base = "https://api.lumalabs.ai";
  const headers = { authorization: `Bearer ${req.project.apiKey}`, "content-type": "application/json" };
  const path = req.modality === "image" ? "/dream-machine/v1/generations/image" : "/dream-machine/v1/generations";
  const body: Record<string, unknown> = { prompt: req.prompt, model: req.modelId, aspect_ratio: req.size };
  if (req.modality === "video") {
    body.duration = `${req.duration ?? 5}s`;
    body.loop = true;
  }

  const start = await fetch(endpoint(req.project, base, path), {
    method: "POST", headers, signal: req.signal, body: JSON.stringify(body),
  });
  if (!start.ok) await readError(start);
  const job = await start.json();
  if (!job?.id) throw new GenerationError("no generation id in response");

  const url = await poll<string>(async () => {
    const res = await fetch(endpoint(req.project, base, `/dream-machine/v1/generations/${job.id}`), { headers, signal: req.signal });
    if (!res.ok) await readError(res);
    const status = await res.json();
    if (status.state === "failed") throw new GenerationError(status.failure_reason ?? "generation failed");
    return { done: status.state === "completed", value: status.assets?.video ?? status.assets?.image };
  }, { signal: req.signal, onProgress: req.onProgress });

  if (!url) throw new GenerationError("no asset in response");
  return {
    remoteUrl: url,
    mime: req.modality === "image" ? "image/png" : "video/mp4",
    modality: req.modality,
  };
}

const ADAPTERS: Record<string, (req: GenerateRequest) => Promise<GeneratedAsset>> = {
  google, openai, fal, replicate, luma,
};

export async function generate(req: GenerateRequest): Promise<GeneratedAsset> {
  const adapter = ADAPTERS[req.project.providerId];
  if (!adapter) throw new GenerationError(`no adapter for provider "${req.project.providerId}"`);
  if (!req.project.apiKey) throw new GenerationError(`project "${req.project.name}" has no API key`);
  if (!getModel(req.project.providerId, req.modelId)) {
    throw new GenerationError(`model "${req.modelId}" is not offered by this project's provider`);
  }
  req.onProgress?.("submitting to provider");
  return adapter(req);
}
