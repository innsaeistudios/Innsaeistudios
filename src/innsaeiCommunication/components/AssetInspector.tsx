/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MousePointerSquareDashed } from "lucide-react";
import { isClipDroppable, startAssetDrag } from "../dragOut";
import type { Asset } from "../types";

interface Props {
  asset?: Asset;
  libraryPath?: string;
}

/** Resolume's clip inspector: the selected capture, its metadata, drag handle. */
export default function AssetInspector({ asset, libraryPath }: Props) {
  return (
    <div className="flex flex-col h-full rc-panel rc-outline min-h-0">
      <div className="rc-header">Inspector</div>

      {!asset ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 p-4 text-center text-[11px] text-[var(--rc-text-dim)]">
          <MousePointerSquareDashed size={20} />
          Select a capture to inspect it, then drag it onto a clip slot.
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto min-h-0">
          <div
            draggable
            onDragStart={(event) => startAssetDrag(event, asset, libraryPath)}
            title="Drag onto a clip slot"
            className="cursor-grab active:cursor-grabbing border-b border-[var(--rc-line)] bg-black"
          >
            <img
              src={asset.url}
              alt={asset.fileName}
              draggable={false}
              referrerPolicy="no-referrer"
              className="w-full aspect-video object-contain"
            />
          </div>

          <dl className="p-2 space-y-1 text-[11px]">
            {[
              ["File", asset.fileName],
              ["Kind", asset.kind],
              ["Type", asset.mimeType],
              ["Resolution", asset.width && asset.height ? `${asset.width}×${asset.height}` : "—"],
              ["Duration", asset.duration ? `${asset.duration.toFixed(1)} s` : "—"],
              ["Captured", new Date(asset.capturedAt).toLocaleString()],
              ["Chat", asset.chatId],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-2">
                <dt className="w-24 shrink-0 text-[var(--rc-text-dim)] uppercase tracking-widest text-[10px] pt-0.5">
                  {label}
                </dt>
                <dd className="text-[var(--rc-text)] break-all">{value}</dd>
              </div>
            ))}
          </dl>

          <p className="px-2 pb-3 text-[10px] leading-relaxed text-[var(--rc-text-dim)]">
            {isClipDroppable(asset)
              ? "Drag the preview above onto any clip slot in Arena to load it as that clip's source."
              : "Resolume cannot use this file type as a clip source. Open it from the library folder instead."}
          </p>
        </div>
      )}
    </div>
  );
}
