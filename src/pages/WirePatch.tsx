import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Boxes, Download, Film, Image as ImageIcon, KeyRound, Loader2, Monitor,
  Play, Plus, Repeat, Trash2, X, Zap,
} from "lucide-react";
import {
  PROVIDERS, getModel, getProvider, modelsFor, type Modality,
} from "../lib/wire/providers";
import {
  loadProjects, maskKey, newProjectId, saveProjects, type ApiProject,
} from "../lib/wire/keyVault";
import { assetObjectUrl, generate } from "../lib/wire/generate";
import {
  RESOLUME_PRESET, SIZE_PRESETS, buildBatchScript, buildManifest, buildRenderJob,
  type RenderJob, type RenderSettings,
} from "../lib/wire/render";

function downloadText(filename: string, contents: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([contents], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const SLOT_COUNT = 12;
const MAX_PARALLEL = 4;

type SlotStatus = "empty" | "queued" | "running" | "ready" | "error";

interface ClipSlot {
  id: string;
  slot: number;
  prompt: string;
  modality: Modality;
  projectId: string;
  modelId: string;
  size: string;
  duration: number;
  status: SlotStatus;
  note: string;
  assetUrl?: string;
  sourceUrl?: string;
  renderJob?: RenderJob;
}

function emptySlot(slot: number): ClipSlot {
  return {
    id: `slot_${slot}`,
    slot,
    prompt: "",
    modality: "video",
    projectId: "",
    modelId: "",
    size: "",
    duration: 5,
    status: "empty",
    note: "",
  };
}

/** Keeps a slot's model/size/duration legal for whichever project it points at. */
function reconcile(slot: ClipSlot, projects: ApiProject[]): ClipSlot {
  const project = projects.find((p) => p.id === slot.projectId) ?? projects[0];
  if (!project) return { ...slot, projectId: "", modelId: "", size: "" };

  const models = modelsFor(project.providerId, slot.modality);
  const model = models.find((m) => m.id === slot.modelId) ?? models[0];
  if (!model) return { ...slot, projectId: project.id, modelId: "", size: "" };

  const size = model.sizes.includes(slot.size) ? slot.size : model.sizes[0];
  const durations = model.durations ?? [];
  const duration = durations.includes(slot.duration) ? slot.duration : durations[0] ?? slot.duration;
  return { ...slot, projectId: project.id, modelId: model.id, size, duration };
}

export default function WirePatch() {
  const [projects, setProjects] = useState<ApiProject[]>(() => loadProjects());
  const [slots, setSlots] = useState<ClipSlot[]>(() =>
    Array.from({ length: SLOT_COUNT }, (_, i) => emptySlot(i + 1)),
  );
  const [settings, setSettings] = useState<RenderSettings>(RESOLUME_PRESET);
  const [autoRender, setAutoRender] = useState(true);
  const [activeSlot, setActiveSlot] = useState(1);
  const [running, setRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => saveProjects(projects), [projects]);
  useEffect(() => setSlots((prev) => prev.map((s) => (s.status === "ready" ? s : reconcile(s, projects)))), [projects]);

  const enabledProjects = useMemo(() => projects.filter((p) => !p.disabled && p.apiKey), [projects]);
  const readySlots = useMemo(() => slots.filter((s) => s.status === "ready" && s.renderJob), [slots]);
  const current = slots.find((s) => s.slot === activeSlot)!;

  const patchSlot = useCallback((slotNo: number, patch: Partial<ClipSlot>) => {
    setSlots((prev) => prev.map((s) => (s.slot === slotNo ? reconcile({ ...s, ...patch }, projects) : s)));
  }, [projects]);

  /* ----------------------------------------------------------- credentials */

  const addProject = () => {
    const provider = PROVIDERS[0];
    setProjects((prev) => [
      ...prev,
      { id: newProjectId(), name: `Project ${prev.length + 1}`, providerId: provider.id, apiKey: "" },
    ]);
  };

  const patchProject = (id: string, patch: Partial<ApiProject>) =>
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const removeProject = (id: string) => setProjects((prev) => prev.filter((p) => p.id !== id));

  /* ------------------------------------------------------------ generation */

  const runSlot = useCallback(async (slot: ClipSlot, project: ApiProject, signal: AbortSignal) => {
    const note = (n: string) => setSlots((prev) => prev.map((s) => (s.id === slot.id ? { ...s, note: n } : s)));
    setSlots((prev) => prev.map((s) => (s.id === slot.id ? { ...s, status: "running", note: "starting" } : s)));
    try {
      const asset = await generate({
        project,
        modelId: slot.modelId,
        modality: slot.modality,
        prompt: slot.prompt,
        size: slot.size,
        duration: slot.duration,
        alpha: settings.alpha,
        signal,
        onProgress: note,
      });
      const renderJob = autoRender
        ? buildRenderJob({
            id: slot.id,
            slot: slot.slot,
            label: slot.prompt.slice(0, 40),
            modality: slot.modality,
            input: asset.remoteUrl ?? `slot_${slot.slot}_source.${slot.modality === "video" ? "mp4" : "png"}`,
            durationSeconds: slot.duration,
          }, settings)
        : undefined;
      setSlots((prev) => prev.map((s) => (s.id === slot.id
        ? { ...s, status: "ready", note: renderJob ? "loop recipe ready" : "generated", assetUrl: assetObjectUrl(asset), sourceUrl: asset.remoteUrl, renderJob }
        : s)));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setSlots((prev) => prev.map((s) => (s.id === slot.id ? { ...s, status: "error", note: message } : s)));
    }
  }, [autoRender, settings]);

  /** Fans the queue out across every enabled project, round-robin, so several
   *  billing accounts generate at once instead of one key rate-limiting. */
  const runQueue = useCallback(async (targets: ClipSlot[]) => {
    if (!enabledProjects.length) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setRunning(true);

    const queue = targets.map((slot, i) => ({
      slot,
      project: projects.find((p) => p.id === slot.projectId && !p.disabled && p.apiKey)
        ?? enabledProjects[i % enabledProjects.length],
    }));
    setSlots((prev) => prev.map((s) => (targets.some((t) => t.id === s.id) ? { ...s, status: "queued", note: "queued" } : s)));

    let cursor = 0;
    const lanes = Array.from({ length: Math.min(MAX_PARALLEL, queue.length) }, async () => {
      while (cursor < queue.length && !controller.signal.aborted) {
        const item = queue[cursor++];
        await runSlot(item.slot, item.project, controller.signal);
      }
    });
    await Promise.all(lanes);
    setRunning(false);
    abortRef.current = null;
  }, [enabledProjects, projects, runSlot]);

  const generateSlot = () => {
    if (current.prompt.trim() && enabledProjects.length) void runQueue([current]);
  };

  const generateAll = () => {
    const targets = slots.filter((s) => s.prompt.trim() && s.status !== "running");
    if (targets.length && enabledProjects.length) void runQueue(targets);
  };

  const cancelAll = () => {
    abortRef.current?.abort();
    setRunning(false);
    setSlots((prev) => prev.map((s) => (s.status === "queued" || s.status === "running" ? { ...s, status: "empty", note: "cancelled" } : s)));
  };

  const clearSlot = (slotNo: number) => setSlots((prev) => prev.map((s) => (s.slot === slotNo ? reconcile(emptySlot(slotNo), projects) : s)));

  /* ---------------------------------------------------------------- export */

  const exportBatch = () => {
    const jobs = readySlots.map((s) => s.renderJob!);
    if (!jobs.length) return;
    downloadText("innsaei_wire_conform.sh", buildBatchScript(jobs), "text/x-shellscript");
    downloadText("innsaei_wire_manifest.json", buildManifest(jobs), "application/json");
  };

  const useScreenSize = () =>
    setSettings((s) => ({ ...s, width: window.screen.width, height: window.screen.height }));

  const model = current.projectId ? getModel(projects.find((p) => p.id === current.projectId)?.providerId ?? "", current.modelId) : undefined;
  const availableModels = useMemo(() => {
    const provider = projects.find((p) => p.id === current.projectId)?.providerId;
    return provider ? modelsFor(provider, current.modality) : [];
  }, [projects, current.projectId, current.modality]);

  return (
    <main className="pt-28 pb-24 px-8 max-w-7xl mx-auto">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-secondary-container font-headline font-bold tracking-[0.3em] text-xs uppercase mb-2 block">
            Generative Pipeline
          </span>
          <h1 className="text-5xl md:text-7xl font-headline font-black tracking-tighter uppercase leading-none">
            Wire <span className="text-primary-container">Patch</span>
          </h1>
          <p className="text-on-surface-variant text-sm mt-4 max-w-2xl">
            Bring your own keys, prompt image or video into a clip slot, and every result comes back
            as a seamless crossfaded loop with a DXV3 / alpha render recipe sized for the room you are playing.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={running ? cancelAll : generateAll}
            disabled={!enabledProjects.length}
            className="flex items-center gap-2 bg-primary-container text-on-primary px-6 py-3 text-xs font-headline font-bold tracking-widest uppercase disabled:opacity-40 hover:brightness-110 transition-all"
          >
            {running ? <><X size={16} /> Cancel batch</> : <><Zap size={16} /> Generate all</>}
          </button>
          <button
            onClick={exportBatch}
            disabled={!readySlots.length}
            className="flex items-center gap-2 border border-secondary-container/50 text-secondary px-6 py-3 text-xs font-headline font-bold tracking-widest uppercase disabled:opacity-30 hover:bg-secondary-container/10 transition-all"
          >
            <Download size={16} /> Export render batch
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-10">
        {/* ------------------------------------------------------- sidebar */}
        <aside className="space-y-8">
          <section className="bg-surface-container-lowest p-6 border-l border-primary-container/30">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-headline text-xs font-bold tracking-[0.2em] text-on-surface-variant uppercase flex items-center gap-2">
                <KeyRound size={14} /> API Projects
              </h2>
              <button onClick={addProject} className="text-primary-container hover:text-white transition-colors" aria-label="Add API project">
                <Plus size={18} />
              </button>
            </div>

            {!projects.length && (
              <p className="text-xs text-gray-500 leading-relaxed">
                Add a key to start. Keys stay in this browser — they are only ever sent to the
                provider you point them at.
              </p>
            )}

            <div className="space-y-5">
              {projects.map((project) => {
                const provider = getProvider(project.providerId);
                return (
                  <div key={project.id} className="border border-white/5 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        value={project.name}
                        onChange={(e) => patchProject(project.id, { name: e.target.value })}
                        className="flex-grow bg-transparent border-b border-white/10 text-xs font-headline tracking-widest uppercase py-1 focus:outline-none focus:border-primary-container"
                        aria-label="Project name"
                      />
                      <button onClick={() => removeProject(project.id)} className="text-gray-600 hover:text-red-400 transition-colors" aria-label="Remove project">
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <select
                      value={project.providerId}
                      onChange={(e) => patchProject(project.id, { providerId: e.target.value })}
                      className="w-full bg-surface-container text-xs font-mono p-2 border border-white/5 focus:outline-none focus:border-primary-container"
                      aria-label="Provider"
                    >
                      {PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>

                    <input
                      type="password"
                      value={project.apiKey}
                      onChange={(e) => patchProject(project.id, { apiKey: e.target.value })}
                      placeholder="API KEY"
                      className="w-full bg-surface-container text-xs font-mono p-2 border border-white/5 focus:outline-none focus:border-primary-container placeholder:text-gray-700"
                      aria-label="API key"
                    />
                    {project.apiKey && (
                      <p className="text-[10px] font-mono text-gray-600 tracking-wider">{maskKey(project.apiKey)}</p>
                    )}
                    <p className="text-[10px] text-gray-600">key from {provider?.keyHint}</p>

                    {provider?.corsBlocked && (
                      <input
                        value={project.proxyBase ?? ""}
                        onChange={(e) => patchProject(project.id, { proxyBase: e.target.value })}
                        placeholder="PROXY BASE URL (required)"
                        className="w-full bg-surface-container text-[10px] font-mono p-2 border border-amber-500/30 focus:outline-none focus:border-amber-400 placeholder:text-amber-600/60"
                        aria-label="Proxy base URL"
                      />
                    )}

                    <label className="flex items-center gap-2 text-[10px] font-headline tracking-widest uppercase text-gray-500">
                      <input
                        type="checkbox"
                        checked={!project.disabled}
                        onChange={(e) => patchProject(project.id, { disabled: !e.target.checked })}
                      />
                      Use in batch
                    </label>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ------------------------------------------------ render preset */}
          <section className="bg-surface-container-lowest p-6 border-l border-secondary-container/30 space-y-4">
            <h2 className="font-headline text-xs font-bold tracking-[0.2em] text-on-surface-variant uppercase flex items-center gap-2 mb-2">
              <Monitor size={14} /> Render Target
            </h2>

            <select
              value={`${settings.width}x${settings.height}`}
              onChange={(e) => {
                const [w, h] = e.target.value.split("x").map(Number);
                setSettings((s) => ({ ...s, width: w, height: h }));
              }}
              className="w-full bg-surface-container text-xs font-mono p-2 border border-white/5 focus:outline-none focus:border-secondary-container"
              aria-label="Output size preset"
            >
              {SIZE_PRESETS.map((p) => (
                <option key={p.label} value={`${p.width}x${p.height}`}>{p.label}</option>
              ))}
              {!SIZE_PRESETS.some((p) => p.width === settings.width && p.height === settings.height) && (
                <option value={`${settings.width}x${settings.height}`}>
                  {settings.width} × {settings.height} (custom)
                </option>
              )}
            </select>

            <div className="flex gap-2">
              <input
                type="number" min={16} value={settings.width}
                onChange={(e) => setSettings((s) => ({ ...s, width: Number(e.target.value) || s.width }))}
                className="w-full bg-surface-container text-xs font-mono p-2 border border-white/5 focus:outline-none focus:border-secondary-container"
                aria-label="Custom width"
              />
              <input
                type="number" min={16} value={settings.height}
                onChange={(e) => setSettings((s) => ({ ...s, height: Number(e.target.value) || s.height }))}
                className="w-full bg-surface-container text-xs font-mono p-2 border border-white/5 focus:outline-none focus:border-secondary-container"
                aria-label="Custom height"
              />
            </div>
            <button onClick={useScreenSize} className="text-[10px] font-headline tracking-widest uppercase text-secondary hover:text-white transition-colors">
              Match this screen
            </button>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={settings.scaleMode}
                onChange={(e) => setSettings((s) => ({ ...s, scaleMode: e.target.value as RenderSettings["scaleMode"] }))}
                className="bg-surface-container text-xs font-mono p-2 border border-white/5 focus:outline-none"
                aria-label="Scale mode"
              >
                <option value="fit">fit</option>
                <option value="fill">fill</option>
              </select>
              <select
                value={settings.quality}
                onChange={(e) => setSettings((s) => ({ ...s, quality: e.target.value as RenderSettings["quality"] }))}
                className="bg-surface-container text-xs font-mono p-2 border border-white/5 focus:outline-none"
                aria-label="Quality"
              >
                <option value="normal">normal quality</option>
                <option value="high">high quality</option>
              </select>
            </div>

            <label className="flex items-center justify-between text-[10px] font-headline tracking-widest uppercase text-gray-400">
              Alpha channel
              <input type="checkbox" checked={settings.alpha} onChange={(e) => setSettings((s) => ({ ...s, alpha: e.target.checked }))} />
            </label>
            <label className="flex items-center justify-between text-[10px] font-headline tracking-widest uppercase text-gray-400">
              Auto-render on finish
              <input type="checkbox" checked={autoRender} onChange={(e) => setAutoRender(e.target.checked)} />
            </label>

            <div>
              <label className="flex items-center justify-between text-[10px] font-headline tracking-widest uppercase text-gray-400 mb-1">
                <span className="flex items-center gap-2"><Repeat size={12} /> Loop fade</span>
                <span className="font-mono text-primary-container">{settings.fadeSeconds.toFixed(2)}s</span>
              </label>
              <input
                type="range" min={0.1} max={2} step={0.05} value={settings.fadeSeconds}
                onChange={(e) => setSettings((s) => ({ ...s, fadeSeconds: Number(e.target.value) }))}
                className="w-full accent-[#00cfff]"
                aria-label="Loop crossfade seconds"
              />
            </div>

            <div>
              <label className="flex items-center justify-between text-[10px] font-headline tracking-widest uppercase text-gray-400 mb-1">
                Frame rate
                <span className="font-mono text-primary-container">{settings.fps}</span>
              </label>
              <select
                value={settings.fps}
                onChange={(e) => setSettings((s) => ({ ...s, fps: Number(e.target.value) }))}
                className="w-full bg-surface-container text-xs font-mono p-2 border border-white/5 focus:outline-none"
                aria-label="Frame rate"
              >
                {[24, 25, 30, 50, 60].map((f) => <option key={f} value={f}>{f} fps</option>)}
              </select>
            </div>
          </section>
        </aside>

        {/* ---------------------------------------------------- clip matrix */}
        <section className="space-y-10">
          <div>
            <h2 className="font-headline text-xs font-bold tracking-[0.2em] text-on-surface-variant uppercase flex items-center gap-2 mb-5">
              <Boxes size={14} /> Clip Slots
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {slots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => setActiveSlot(slot.slot)}
                  className={`group relative aspect-video bg-black border text-left overflow-hidden transition-all ${
                    slot.slot === activeSlot ? "border-primary-container neon-glow-blue" : "border-white/10 hover:border-white/30"
                  }`}
                >
                  {slot.assetUrl && slot.modality === "image" && (
                    <img src={slot.assetUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                  )}
                  {slot.assetUrl && slot.modality === "video" && (
                    <video src={slot.assetUrl} className="absolute inset-0 w-full h-full object-cover opacity-80" muted loop autoPlay playsInline />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  <div className="absolute top-2 left-2 text-[10px] font-mono tracking-widest text-gray-400">
                    {String(slot.slot).padStart(2, "0")}
                  </div>
                  <div className="absolute top-2 right-2">
                    {slot.status === "running" && <Loader2 size={14} className="animate-spin text-primary-container" />}
                    {slot.status === "queued" && <span className="text-[9px] font-mono text-amber-400">QUEUED</span>}
                    {slot.status === "ready" && <span className="text-[9px] font-mono text-primary-container">LOOP</span>}
                    {slot.status === "error" && <span className="text-[9px] font-mono text-red-400">ERR</span>}
                  </div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-[10px] text-gray-300 line-clamp-2 leading-tight">
                      {slot.prompt || <span className="text-gray-600">empty slot</span>}
                    </p>
                    {slot.note && <p className="text-[9px] font-mono text-gray-600 truncate mt-1">{slot.note}</p>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ------------------------------------------------ slot editor */}
          <div className="bg-surface-container-lowest border border-white/5 p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-lg font-bold tracking-tighter uppercase">
                Slot {String(current.slot).padStart(2, "0")}
              </h3>
              <button onClick={() => clearSlot(current.slot)} className="text-[10px] font-headline tracking-widest uppercase text-gray-500 hover:text-red-400 transition-colors">
                Clear
              </button>
            </div>

            <div className="flex gap-2">
              {(["video", "image"] as Modality[]).map((m) => (
                <button
                  key={m}
                  onClick={() => patchSlot(current.slot, { modality: m })}
                  className={`flex items-center gap-2 px-5 py-2 text-xs font-headline font-bold tracking-widest uppercase border transition-all ${
                    current.modality === m
                      ? "border-primary-container text-primary-container bg-primary-container/10"
                      : "border-white/10 text-gray-500 hover:text-white"
                  }`}
                >
                  {m === "video" ? <Film size={14} /> : <ImageIcon size={14} />} {m}
                </button>
              ))}
            </div>

            <textarea
              value={current.prompt}
              onChange={(e) => patchSlot(current.slot, { prompt: e.target.value })}
              rows={3}
              placeholder="Describe the loop — e.g. slow drifting chrome liquid over black, macro, high contrast"
              className="w-full bg-surface-container border border-white/5 p-4 text-sm focus:outline-none focus:border-primary-container placeholder:text-gray-700"
              aria-label="Prompt"
            />

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <select
                value={current.projectId}
                onChange={(e) => patchSlot(current.slot, { projectId: e.target.value })}
                className="bg-surface-container text-xs font-mono p-3 border border-white/5 focus:outline-none focus:border-primary-container"
                aria-label="API project"
              >
                {!projects.length && <option value="">no API project</option>}
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>

              <select
                value={current.modelId}
                onChange={(e) => patchSlot(current.slot, { modelId: e.target.value })}
                className="bg-surface-container text-xs font-mono p-3 border border-white/5 focus:outline-none focus:border-primary-container"
                aria-label="Model"
              >
                {!availableModels.length && <option value="">no {current.modality} model</option>}
                {availableModels.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>

              <select
                value={current.size}
                onChange={(e) => patchSlot(current.slot, { size: e.target.value })}
                className="bg-surface-container text-xs font-mono p-3 border border-white/5 focus:outline-none focus:border-primary-container"
                aria-label="Source size"
              >
                {(model?.sizes ?? []).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>

              <select
                value={current.duration}
                onChange={(e) => patchSlot(current.slot, { duration: Number(e.target.value) })}
                disabled={current.modality === "image"}
                className="bg-surface-container text-xs font-mono p-3 border border-white/5 focus:outline-none focus:border-primary-container disabled:opacity-30"
                aria-label="Clip length"
              >
                {(model?.durations ?? []).map((d) => <option key={d} value={d}>{d}s</option>)}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={generateSlot}
                disabled={running || !current.prompt.trim() || !enabledProjects.length}
                className="flex items-center gap-2 bg-primary-container text-on-primary px-6 py-3 text-xs font-headline font-bold tracking-widest uppercase disabled:opacity-40 hover:brightness-110 transition-all"
              >
                <Play size={14} /> Generate slot
              </button>
              <span className="text-[10px] font-mono text-gray-500">
                {settings.width}×{settings.height} · {settings.scaleMode} · Wire DXV3 {settings.quality}
                {settings.alpha ? " + alpha" : ""} · {settings.fadeSeconds.toFixed(2)}s loop fade
              </span>
            </div>

            {current.status === "error" && (
              <p className="text-xs font-mono text-red-400 break-words">{current.note}</p>
            )}

            {current.renderJob && (
              <div className="border border-primary-container/20 bg-black p-4 space-y-2">
                <p className="text-[10px] font-headline tracking-widest uppercase text-primary-container">
                  Render recipe → {current.renderJob.output}
                </p>
                <pre className="text-[10px] font-mono text-gray-400 whitespace-pre-wrap break-all">{current.renderJob.command}</pre>
              </div>
            )}
          </div>

          <p className="text-[11px] text-gray-600 leading-relaxed max-w-3xl">
            Generation runs straight from your browser to the provider, up to {MAX_PARALLEL} clips at a time,
            fanned out across every enabled API project so several accounts share the load.
            Providers that block browser calls need a proxy URL on their project. Export the batch for a
            manifest plus an ffmpeg script that conforms each clip into a looping, canvas-fitted
            ProRes 4444 — that is what the Wire patch's video resource slot loads. DXV3 with alpha is
            written by Wire's own Video Exporter. For an unattended show machine run
            <span className="font-mono text-gray-500"> npm run wire </span> instead of this page.
          </p>
        </section>
      </div>
    </main>
  );
}
