import { Puzzle, History, Bell, Settings, RefreshCw, Download, PlusCircle } from "lucide-react";

export default function Dashboard() {
  const plugins = [
    { id: 1, code: "PX_082", title: "CYBER_FLUX", version: "v2.3.9_Stable", date: "12.OCT.24", image: "https://picsum.photos/seed/cyber/800/450", pro: true },
    { id: 2, code: "PX_119", title: "NEON_GHOST", version: "v1.0.4_Final", date: "02.SEP.24", image: "https://picsum.photos/seed/ghost2/800/450", pro: false },
    { id: 3, code: "PX_330", title: "VOID_ENGINE", version: "v4.1.2_Stable", date: "28.NOV.24", image: "https://picsum.photos/seed/void2/800/450", pro: true },
  ];

  return (
    <main className="pt-24 pb-12 px-8 min-h-screen max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
      {/* Sidebar */}
      <aside className="w-full md:w-64 flex-shrink-0 space-y-8">
        <div className="bg-surface-container-lowest p-6 border-l border-primary-container/30">
          <h3 className="font-headline text-xs font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-6">User Portal</h3>
          <nav className="flex flex-col gap-4">
            <button className="flex items-center gap-3 text-primary-container font-headline text-sm tracking-tighter text-left">
              <Puzzle size={18} fill="currentColor" />
              Purchased Plugins
            </button>
            <button className="flex items-center gap-3 text-on-surface-variant hover:text-white font-headline text-sm tracking-tighter transition-all text-left">
              <History size={18} />
              Download History
            </button>
            <button className="flex items-center gap-3 text-on-surface-variant hover:text-white font-headline text-sm tracking-tighter transition-all text-left">
              <Bell size={18} />
              Notifications
              <span className="w-1.5 h-1.5 bg-secondary-container rounded-full animate-pulse"></span>
            </button>
            <button className="flex items-center gap-3 text-on-surface-variant hover:text-white font-headline text-sm tracking-tighter transition-all text-left">
              <Settings size={18} />
              Account Settings
            </button>
          </nav>
        </div>
        <div className="bg-surface-container-lowest p-6 border-l border-secondary-container/30">
          <h3 className="font-headline text-xs font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-4">Live Status</h3>
          <div className="flex items-center gap-3">
            <div className="w-1 h-1 bg-secondary-container shadow-[0_0_8px_#b300ff]"></div>
            <span className="text-[10px] font-mono tracking-widest text-secondary uppercase">Server Link Alpha: Active</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <section className="flex-grow space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-baseline gap-4">
          <div>
            <h1 className="font-headline text-4xl md:text-5xl font-black tracking-tighter text-white uppercase italic">MY_PLUGINS</h1>
            <p className="text-on-surface-variant font-body text-sm mt-2 max-w-md">Access your visual intelligence library and latest architectural kernels.</p>
          </div>
          <div className="bg-surface-container-high px-4 py-2 text-[10px] font-mono tracking-widest text-primary uppercase">Total Assets: 08</div>
        </div>

        {/* Update Alert */}
        <div className="bg-surface-container-lowest border border-primary-container/20 p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="p-4 bg-primary-container/10">
            <RefreshCw className="text-primary-container" size={32} />
          </div>
          <div className="flex-grow">
            <h4 className="font-headline text-lg font-bold tracking-tight text-white uppercase">Critical Kernel Update Available</h4>
            <p className="text-on-surface-variant text-sm mt-1">Version 2.4.0 of "CYBER_FLUX" includes ray-tracing optimizations for high-density visual feeds.</p>
          </div>
          <button className="w-full md:w-auto px-8 py-3 bg-primary-container text-on-primary font-headline text-xs font-bold tracking-widest uppercase hover:neon-glow-blue transition-all">Update All</button>
        </div>

        {/* Plugin Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-white/5 border border-white/5">
          {plugins.map((plugin) => (
            <div key={plugin.id} className="bg-black p-8 group hover:bg-surface-container-lowest transition-all duration-500">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-primary-container mb-2 block">ID_CODE: {plugin.code}</span>
                  <h3 className="font-headline text-2xl font-bold tracking-tighter text-white uppercase">{plugin.title}</h3>
                </div>
                {plugin.pro && (
                  <span className="bg-secondary-container/20 text-secondary text-[10px] font-bold px-3 py-1 tracking-widest uppercase">Pro License</span>
                )}
              </div>
              <div className="h-48 mb-8 overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700">
                <img src={plugin.image} alt={plugin.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-xs text-on-surface-variant font-mono">{plugin.version}</p>
                  <p className="text-[10px] text-gray-600 font-mono italic">Released: {plugin.date}</p>
                </div>
                <button className="flex items-center gap-2 font-headline text-xs font-bold tracking-widest text-white hover:text-primary-container transition-colors">
                  DOWNLOAD
                  <Download size={16} />
                </button>
              </div>
            </div>
          ))}
          <div className="bg-surface-container-lowest p-8 flex flex-col items-center justify-center text-center group border-2 border-dashed border-white/5 hover:border-primary-container/30 transition-all">
            <PlusCircle className="text-on-surface-variant mb-4 group-hover:text-primary-container transition-colors" size={40} />
            <h3 className="font-headline text-xl font-bold tracking-tighter text-white uppercase">Expand Arsenal</h3>
            <p className="text-on-surface-variant text-xs mt-2 mb-6 max-w-[200px]">Browse the plugin laboratory for new visual synthesis modules.</p>
            <button className="px-6 py-2 border border-white/20 text-[10px] font-bold tracking-[0.2em] text-white uppercase hover:bg-white hover:text-black transition-all">Visit Gallery</button>
          </div>
        </div>
      </section>
    </main>
  );
}
