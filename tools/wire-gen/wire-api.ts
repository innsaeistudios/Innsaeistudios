#!/usr/bin/env tsx
/**
 * Probes the Wire REST API on this machine and writes down what it offers.
 *
 *   npm run wire:api                       # Wire on the default port
 *   npm run wire:api -- --port 8081 --out api-dump.json
 *
 * Wire's API v2 can create, connect and manage nodes, which means the patch
 * can be built programmatically rather than by hand or by writing a .wired
 * file (that format is not documented). This probe records the exact endpoint
 * shapes so the patch builder can be written against them.
 *
 * Resolume serves Arena/Avenue on 8080 and Wire on 8081 by default. Both need
 * "Enable webserver" switched on in Preferences → Webserver.
 */

import { writeFile } from "node:fs/promises";

interface Probe { url: string; status: number | string; contentType?: string; sample?: unknown }

const CANDIDATES = [
  "/api/v2", "/api/v2/", "/api/v2/openapi.json", "/api/v2/swagger.json",
  "/api/v2/nodes", "/api/v2/node-types", "/api/v2/patch", "/api/v2/composition",
  "/api/v1", "/api/v1/product", "/api/v1/composition",
  "/openapi.json", "/swagger.json", "/docs",
];

async function probe(base: string, path: string): Promise<Probe> {
  const url = `${base}${path}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    const contentType = res.headers.get("content-type") ?? undefined;
    let sample: unknown;
    if (res.ok) {
      const text = await res.text();
      // Keep JSON structure; truncate anything else to a readable snippet.
      try {
        const json = JSON.parse(text);
        sample = Array.isArray(json) ? json.slice(0, 8) : trim(json);
      } catch {
        sample = text.slice(0, 300);
      }
    }
    return { url, status: res.status, contentType, sample };
  } catch (err) {
    return { url, status: err instanceof Error ? err.name : "error" };
  }
}

/** Keeps the shape of an object while dropping the bulk of its contents. */
function trim(value: unknown, depth = 0): unknown {
  if (Array.isArray(value)) return value.slice(0, 5).map((v) => trim(v, depth + 1));
  if (value && typeof value === "object") {
    if (depth > 3) return "…";
    return Object.fromEntries(Object.entries(value).slice(0, 25).map(([k, v]) => [k, trim(v, depth + 1)]));
  }
  return value;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const port = Number(argv[argv.indexOf("--port") + 1]) || 8081;
  const host = argv.includes("--host") ? argv[argv.indexOf("--host") + 1] : "127.0.0.1";
  const out = argv.includes("--out") ? argv[argv.indexOf("--out") + 1] : "wire-api-dump.json";
  const base = `http://${host}:${port}`;

  console.log(`probing Wire at ${base}\n`);
  const results: Probe[] = [];
  for (const path of CANDIDATES) {
    const result = await probe(base, path);
    results.push(result);
    const ok = typeof result.status === "number" && result.status < 400;
    console.log(`  ${ok ? "✓" : "·"} ${String(result.status).padEnd(7)} ${path}`);
  }

  const live = results.filter((r) => typeof r.status === "number" && r.status < 400);
  await writeFile(out, JSON.stringify({ base, probedAt: new Date().toISOString(), results }, null, 2));

  console.log(`\n${live.length} endpoint(s) responded. Full dump → ${out}`);
  if (!live.length) {
    console.log(
      "\nNothing answered. Check that Wire is running, and that\n" +
      "Preferences → Webserver has the webserver enabled (Wire defaults to 8081,\n" +
      "Arena/Avenue to 8080). Try --port 8080 to confirm the API is reachable at all.",
    );
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(`wire-api: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
