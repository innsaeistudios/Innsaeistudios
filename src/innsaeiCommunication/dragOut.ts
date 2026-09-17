/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { DragEvent } from "react";
import type { Asset } from "./types";

/**
 * Prepares a drag so the dragged item lands on a Resolume clip slot as a real
 * file. Chromium (which backs Resolume's web view and Chrome/Edge on the
 * desktop) turns a `DownloadURL` drag payload into a file drop on the OS, which
 * is what Resolume accepts on a clip. The extra flavours are there so the same
 * drag still carries something useful for apps that read URLs or paths.
 */
export function startAssetDrag(event: DragEvent, asset: Asset, libraryPath?: string): void {
  const transfer = event.dataTransfer;
  const absoluteUrl = new URL(asset.url, window.location.href).href;

  // Chromium file drag-out: "<mime>:<filename>:<url>".
  transfer.setData("DownloadURL", `${asset.mimeType}:${asset.fileName}:${absoluteUrl}`);
  transfer.setData("text/uri-list", absoluteUrl);
  transfer.setData("text/plain", libraryPath ? `${libraryPath}/${asset.chatId}/${asset.fileName}` : absoluteUrl);
  transfer.setData("application/x-innsaei-asset", JSON.stringify(asset));
  transfer.effectAllowed = "copy";

  // Drag the visible thumbnail rather than the whole card.
  const thumb = (event.currentTarget as HTMLElement).querySelector("img");
  if (thumb) transfer.setDragImage(thumb, thumb.clientWidth / 2, thumb.clientHeight / 2);
}

/** True for assets Resolume can load straight into a clip. */
export function isClipDroppable(asset: Asset): boolean {
  return asset.kind === "image" || asset.kind === "video" || asset.kind === "audio";
}
