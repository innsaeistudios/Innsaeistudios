/**
 * Local-only store for the API credentials the patch generates with.
 *
 * Keys never leave the browser except in the request to the provider the user
 * pointed them at (or the proxy they configured for it). Nothing is sent to
 * an Innsaei server.
 */

const STORAGE_KEY = "innsaei.wire.projects.v1";

export interface ApiProject {
  /** Stable local id. */
  id: string;
  /** User-facing name, e.g. "Jalwa Club - main". Lets one patch fan out across billing accounts. */
  name: string;
  providerId: string;
  apiKey: string;
  /**
   * Optional CORS proxy base. The provider path is appended to it, so
   * "https://proxy.local/api" + "/v1/images/generations".
   */
  proxyBase?: string;
  /** Skip this project when fanning a batch out across projects. */
  disabled?: boolean;
}

export function loadProjects(): ApiProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ApiProject[]) : [];
  } catch {
    return [];
  }
}

export function saveProjects(projects: ApiProject[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    /* private mode / quota — the patch still runs for this session */
  }
}

export function newProjectId(): string {
  return `prj_${Math.random().toString(36).slice(2, 10)}`;
}

/** Shows enough of a key to recognise it, never enough to use it. */
export function maskKey(key: string): string {
  if (key.length <= 8) return "•".repeat(key.length);
  return `${key.slice(0, 4)}${"•".repeat(Math.min(16, key.length - 8))}${key.slice(-4)}`;
}
