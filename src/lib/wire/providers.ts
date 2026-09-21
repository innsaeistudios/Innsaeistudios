/**
 * Provider + model catalog for the Wire Patch content generator.
 *
 * Every entry describes how to submit a generation job and (for the async
 * providers) how to poll it, so the runner in `generate.ts` stays generic.
 */

export type Modality = "image" | "video";

export interface ModelSpec {
  id: string;
  label: string;
  modality: Modality;
  /** Aspect ratios / sizes the model accepts, in the provider's own wording. */
  sizes: string[];
  /** Clip length options in seconds. Video only. */
  durations?: number[];
  /** True when the model can return a transparent background. */
  alpha?: boolean;
}

export interface ProviderSpec {
  id: string;
  label: string;
  /** Where the key is minted, shown next to the key field. */
  keyHint: string;
  /** Direct browser calls are blocked by CORS on these — needs a proxy. */
  corsBlocked: boolean;
  models: ModelSpec[];
}

export const PROVIDERS: ProviderSpec[] = [
  {
    id: "google",
    label: "Google AI Studio",
    keyHint: "aistudio.google.com/apikey",
    corsBlocked: false,
    models: [
      { id: "imagen-4.0-generate-001", label: "Imagen 4", modality: "image", sizes: ["1:1", "16:9", "9:16", "4:3", "3:4"] },
      { id: "imagen-4.0-fast-generate-001", label: "Imagen 4 Fast", modality: "image", sizes: ["1:1", "16:9", "9:16"] },
      { id: "gemini-2.5-flash-image", label: "Gemini 2.5 Flash Image", modality: "image", sizes: ["1:1", "16:9", "9:16"] },
      { id: "veo-3.0-generate-001", label: "Veo 3", modality: "video", sizes: ["16:9", "9:16"], durations: [4, 6, 8] },
      { id: "veo-3.0-fast-generate-001", label: "Veo 3 Fast", modality: "video", sizes: ["16:9", "9:16"], durations: [4, 6, 8] },
    ],
  },
  {
    id: "openai",
    label: "OpenAI",
    keyHint: "platform.openai.com/api-keys",
    corsBlocked: true,
    models: [
      { id: "gpt-image-1", label: "GPT Image 1", modality: "image", sizes: ["1024x1024", "1536x1024", "1024x1536"], alpha: true },
      { id: "sora-2", label: "Sora 2", modality: "video", sizes: ["1280x720", "720x1280"], durations: [4, 8, 12] },
      { id: "sora-2-pro", label: "Sora 2 Pro", modality: "video", sizes: ["1280x720", "1792x1024"], durations: [4, 8, 12] },
    ],
  },
  {
    id: "fal",
    label: "fal.ai",
    keyHint: "fal.ai/dashboard/keys",
    corsBlocked: false,
    models: [
      { id: "fal-ai/flux/dev", label: "FLUX.1 [dev]", modality: "image", sizes: ["square_hd", "landscape_16_9", "portrait_16_9"] },
      { id: "fal-ai/flux-pro/v1.1-ultra", label: "FLUX1.1 Ultra", modality: "image", sizes: ["16:9", "1:1", "9:16"] },
      { id: "fal-ai/kling-video/v2/master/text-to-video", label: "Kling 2 Master", modality: "video", sizes: ["16:9", "9:16", "1:1"], durations: [5, 10] },
      { id: "fal-ai/ltx-video", label: "LTX Video", modality: "video", sizes: ["16:9", "9:16"], durations: [5] },
    ],
  },
  {
    id: "replicate",
    label: "Replicate",
    keyHint: "replicate.com/account/api-tokens",
    corsBlocked: true,
    models: [
      { id: "black-forest-labs/flux-1.1-pro", label: "FLUX 1.1 Pro", modality: "image", sizes: ["16:9", "1:1", "9:16"] },
      { id: "stability-ai/stable-diffusion-3.5-large", label: "SD 3.5 Large", modality: "image", sizes: ["16:9", "1:1", "9:16"] },
      { id: "minimax/video-01", label: "MiniMax Video-01", modality: "video", sizes: ["16:9"], durations: [6] },
      { id: "tencent/hunyuan-video", label: "Hunyuan Video", modality: "video", sizes: ["16:9", "9:16"], durations: [5] },
    ],
  },
  {
    id: "luma",
    label: "Luma Dream Machine",
    keyHint: "lumalabs.ai/api/keys",
    corsBlocked: true,
    models: [
      { id: "photon-1", label: "Photon", modality: "image", sizes: ["16:9", "1:1", "9:16"] },
      { id: "ray-2", label: "Ray 2", modality: "video", sizes: ["16:9", "9:16", "1:1"], durations: [5, 9] },
      { id: "ray-flash-2", label: "Ray Flash 2", modality: "video", sizes: ["16:9", "9:16"], durations: [5, 9] },
    ],
  },
];

export function getProvider(id: string): ProviderSpec | undefined {
  return PROVIDERS.find((p) => p.id === id);
}

export function getModel(providerId: string, modelId: string): ModelSpec | undefined {
  return getProvider(providerId)?.models.find((m) => m.id === modelId);
}

export function modelsFor(providerId: string, modality: Modality): ModelSpec[] {
  return getProvider(providerId)?.models.filter((m) => m.modality === modality) ?? [];
}
