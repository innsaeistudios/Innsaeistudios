import { Search, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Store() {
  const plugins = [
    { id: 1, title: "NEURAL DRIFT V1", price: "$49.00", desc: "Advanced GLSL shader package for real-time generative feedback loops. Optimized for live performance.", image: "https://picsum.photos/seed/drift/800/450", color: "blue" },
    { id: 2, title: "VOID GEOMETRY", price: "$35.00", desc: "Set of 50 reactive 3D primitives for Cinema4D and TouchDesigner. Low-poly, high-impact assets.", image: "https://picsum.photos/seed/geom/800/450", color: "purple" },
    { id: 3, title: "CRT ENGINE", price: "$59.00", desc: "Perfect analog glitch emulation. Authentic phosphor bloom and scanline textures for digital feeds.", image: "https://picsum.photos/seed/crt/800/450", color: "blue" },
    { id: 4, title: "MACRO DATA", price: "$42.00", desc: "Data visualization suite for live MIDI input. Transform sound into intricate network maps.", image: "https://picsum.photos/seed/data/800/450", color: "purple" },
    { id: 5, title: "GLITCH CORE", price: "$29.00", desc: "Aggressive pixel-sorting algorithms and digital noise generators for high-tempo visuals.", image: "https://picsum.photos/seed/glitch/800/450", color: "blue" },
    { id: 6, title: "GHOST FLOW", price: "$65.00", desc: "Advanced particle system for fluid-like visual transitions. Soft, organic, and haunting.", image: "https://picsum.photos/seed/ghost/800/450", color: "purple" },
  ];

  return (
    <main className="pt-32 pb-24 px-8 max-w-7xl mx-auto">
      {/* Store Header */}
      <section className="mb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <span className="text-secondary-container font-headline font-bold tracking-[0.3em] text-xs uppercase mb-2 block">Visual Arsenal</span>
            <h1 className="text-5xl md:text-7xl font-headline font-black tracking-tighter uppercase leading-none">
              Plugin <span className="text-primary-container">Store</span>
            </h1>
          </div>
          <div className="flex items-center gap-4 bg-surface-container-lowest p-2 border-b border-white/10">
            <Search className="text-on-surface-variant px-2" size={32} />
            <input
              type="text"
              placeholder="SEARCH PLUGINS..."
              className="bg-transparent border-none focus:ring-0 text-xs font-headline tracking-widest uppercase w-64 placeholder:text-gray-600"
            />
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {plugins.map((plugin) => (
          <div
            key={plugin.id}
            className={`group relative bg-surface-container-lowest border border-white/5 transition-all duration-500 ${
              plugin.color === "blue" ? "hover:border-primary-container/50 neon-glow-blue" : "hover:border-secondary-container/50 neon-glow-purple"
            }`}
          >
            <div className="aspect-video overflow-hidden bg-black relative">
              <img
                src={plugin.image}
                alt={plugin.title}
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100"
                referrerPolicy="no-referrer"
              />
              <div className={`absolute top-4 right-4 bg-black/80 backdrop-blur-md px-3 py-1 text-[10px] font-headline font-bold tracking-widest uppercase border ${
                plugin.color === "blue" ? "border-primary-container/20 text-primary-container" : "border-secondary-container/20 text-secondary-container"
              }`}>
                .ZIP
              </div>
            </div>
            <div className="p-8">
              <div className="flex justify-between items-start mb-4">
                <Link to={`/plugin/${plugin.id}`} className={`text-xl font-headline font-bold tracking-tight uppercase transition-colors ${
                  plugin.color === "blue" ? "group-hover:text-primary-container" : "group-hover:text-secondary-container"
                }`}>
                  {plugin.title}
                </Link>
                <span className={plugin.color === "blue" ? "text-primary-container font-headline font-bold" : "text-secondary-container font-headline font-bold"}>
                  {plugin.price}
                </span>
              </div>
              <p className="text-on-surface-variant text-sm mb-8 leading-relaxed">{plugin.desc}</p>
              <button className={`w-full bg-surface-container-high border border-white/10 transition-all duration-300 py-4 font-headline font-bold text-xs tracking-[0.2em] flex items-center justify-center gap-2 ${
                plugin.color === "blue" ? "hover:bg-primary-container hover:text-on-primary" : "hover:bg-secondary-container hover:text-white"
              }`}>
                BUY NOW <span className="text-[10px] opacity-60">(CRYPTO + CARD)</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-20 flex flex-col md:flex-row items-center justify-between gap-8 py-8 border-t border-white/5">
        <div className="flex gap-2">
          <button className="w-10 h-10 flex items-center justify-center border border-primary-container text-primary-container font-headline font-bold text-xs">1</button>
          <button className="w-10 h-10 flex items-center justify-center border border-white/10 text-on-surface-variant font-headline font-bold text-xs hover:border-white/40 transition-colors">2</button>
          <button className="w-10 h-10 flex items-center justify-center border border-white/10 text-on-surface-variant font-headline font-bold text-xs hover:border-white/40 transition-colors">3</button>
          <button className="w-10 h-10 flex items-center justify-center border border-white/10 text-on-surface-variant font-headline font-bold text-xs hover:border-white/40 transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="text-on-surface-variant font-headline text-[10px] tracking-[0.3em] uppercase">
          SHOWING 6 OF 48 PLUGINS
        </div>
      </div>
    </main>
  );
}
