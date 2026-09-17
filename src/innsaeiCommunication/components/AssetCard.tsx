/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FileAudio2, FileText, Film, Image as ImageIcon } from "lucide-react";
import { isClipDroppable, startAssetDrag } from "../dragOut";
import type { Asset } from "../types";

const kindIcon = {
  image: ImageIcon,
  video: Film,
  audio: FileAudio2,
  document: FileText,
  text: FileText,
} as const;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  asset: Asset;
  selected: boolean;
  libraryPath?: string;
  onSelect: (asset: Asset) => void;
}

/**
 * One capture in the browser grid. Drag it straight onto a Resolume clip slot;
 * the drag carries the file itself (see dragOut.ts).
 */
export default function AssetCard({ asset, selected, libraryPath, onSelect }: Props) {
  const Icon = kindIcon[asset.kind];
  const droppable = isClipDroppable(asset);

  return (
    <button
      type="button"
      draggable
      onDragStart={(event) => startAssetDrag(event, asset, libraryPath)}
      onClick={() => onSelect(asset)}
      title={`${asset.fileName} — drag onto a clip slot`}
      className={`group text-left rc-panel rc-outline overflow-hidden cursor-grab active:cursor-grabbing transition-colors ${
        selected ? "outline outline-1 outline-[var(--rc-accent)]" : "hover:border-[var(--rc-accent)]/50"
      }`}
    >
      <div className="relative aspect-video bg-black overflow-hidden">
        <img
          src={asset.thumbnailUrl}
          alt={asset.fileName}
          draggable={false}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
        <span className="absolute top-1 left-1 flex items-center gap-1 bg-black/75 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-[var(--rc-text-dim)]">
          <Icon size={10} /> {asset.kind}
        </span>
        {!droppable && (
          <span className="absolute bottom-1 right-1 bg-black/75 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-[var(--rc-warn)]">
            not a clip source
          </span>
        )}
      </div>
      <div className="px-2 py-1.5">
        <p className="truncate text-[11px] text-[var(--rc-text)]">{asset.fileName}</p>
        <p className="text-[10px] text-[var(--rc-text-dim)]">
          {asset.width && asset.height ? `${asset.width}×${asset.height} · ` : ""}
          {formatBytes(asset.bytes)}
        </p>
      </div>
    </button>
  );
}
