/**
 * Config loading for the wire-gen CLI. Keys come from the config file or, by
 * preference, from the environment so they never sit in a repo.
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { ApiProject } from "../../src/lib/wire/keyVault";
import type { Modality } from "../../src/lib/wire/providers";
import { RESOLUME_PRESET, type RenderSettings } from "../../src/lib/wire/render";
import type { OscTarget } from "./osc";

export interface ClipRequest {
  slot: number;
  prompt: string;
  modality: Modality;
  /** Optional: pin this clip to one project by name, instead of round-robin. */
  project?: string;
  model?: string;
  size?: string;
  duration?: number;
}

export interface ProjectConfig extends Omit<ApiProject, "apiKey"> {
  apiKey?: string;
  /** Preferred: name of the environment variable holding the key. */
  apiKeyEnv?: string;
}

export interface WireGenConfig {
  /** Where the conformed clips land — point the Wire resource slot here. */
  resourcesDir: string;
  /** Raw provider output, kept for re-conforming without re-paying. */
  sourcesDir: string;
  projects: ProjectConfig[];
  render: RenderSettings;
  /** How many clips generate at once, across all projects. */
  concurrency: number;
  /** Path to ffmpeg. Set to null to skip the conform pass entirely. */
  ffmpegPath: string | null;
  osc?: OscTarget & {
    /** Address the patch listens on for "slot N has a new file". Receives (slot, path). */
    clipAddress: string;
    enabled: boolean;
  };
  clips: ClipRequest[];
}

const DEFAULTS: Omit<WireGenConfig, "projects" | "clips"> = {
  resourcesDir: "./out/wire-resources",
  sourcesDir: "./out/sources",
  render: RESOLUME_PRESET,
  concurrency: 4,
  ffmpegPath: "ffmpeg",
  osc: { host: "127.0.0.1", port: 7000, clipAddress: "/wire/clip", enabled: false },
};

export type ResolvedConfig = Omit<WireGenConfig, "projects"> & { projects: ApiProject[] };

export async function loadConfig(path: string): Promise<ResolvedConfig> {
  const raw = JSON.parse(await readFile(resolve(path), "utf8"));
  const merged: WireGenConfig = { ...DEFAULTS, ...raw, render: { ...DEFAULTS.render, ...raw.render } };

  const projects: ApiProject[] = (merged.projects ?? []).map((p) => {
    const apiKey = p.apiKey ?? (p.apiKeyEnv ? process.env[p.apiKeyEnv] : undefined);
    if (!apiKey) {
      throw new Error(`project "${p.name}" has no API key (set apiKey, or apiKeyEnv pointing at a set variable)`);
    }
    return { id: p.id, name: p.name, providerId: p.providerId, apiKey, proxyBase: p.proxyBase, disabled: p.disabled };
  });

  if (!projects.some((p) => !p.disabled)) throw new Error("no enabled projects in config");
  if (!merged.clips?.length) throw new Error("no clips in config");

  return { ...merged, projects };
}
