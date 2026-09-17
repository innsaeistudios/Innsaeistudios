/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExternalLink } from "lucide-react";
import CommunicationPanel from "../innsaeiCommunication/CommunicationPanel";

/**
 * Hosted view of the panel. Resolume loads the bare panel at /panel (see
 * main.tsx) — this page adds the site chrome and setup notes around it.
 */
export default function Communication() {
  return (
    <main className="pt-32 pb-24 px-8 max-w-7xl mx-auto">
      <section className="mb-10">
        <span className="text-secondary-container font-headline font-bold tracking-[0.3em] text-xs uppercase mb-2 block">
          Resolume Arena Patch
        </span>
        <h1 className="text-5xl md:text-7xl font-headline font-black tracking-tighter uppercase leading-none">
          Innsaei <span className="text-primary-container">Communication</span>
        </h1>
        <p className="text-on-surface-variant text-sm mt-6 max-w-2xl leading-relaxed">
          WhatsApp inside Arena. Every contact and group opens like a source folder, with all
          messages, replies and files captured underneath it. Drag any capture straight onto a clip
          slot.
        </p>
        <a
          href="/panel"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 mt-6 border border-white/10 bg-surface-container-lowest px-4 py-2 text-xs font-headline tracking-[0.2em] uppercase hover:border-primary-container/50"
        >
          Open bare panel for Arena <ExternalLink size={12} />
        </a>
      </section>

      <div className="h-[680px] border border-white/10">
        <CommunicationPanel />
      </div>

      <section className="mt-12 grid gap-8 md:grid-cols-3 text-sm">
        {[
          {
            title: "1 · Run the bridge",
            body: "npm run bridge on the machine running Arena, then pair WhatsApp by scanning the QR code in the panel's status bar.",
          },
          {
            title: "2 · Add the panel in Arena",
            body: "Sources → Web Page, point it at http://127.0.0.1:3000/panel, and drop it on a layer you keep on a preview monitor.",
          },
          {
            title: "3 · Drag to a clip",
            body: "Pick a capture, drag its preview onto any clip slot. Files also land in the bridge library folder, which Arena can index as a source folder.",
          },
        ].map((step) => (
          <div key={step.title} className="border border-white/5 bg-surface-container-lowest p-6">
            <h2 className="font-headline font-bold tracking-widest uppercase text-xs mb-3 text-primary-container">
              {step.title}
            </h2>
            <p className="text-on-surface-variant leading-relaxed">{step.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
