import { Play, Terminal, Waves, Sparkles, Settings, Gauge, Layers, Cpu, ShoppingCart, CreditCard, Bitcoin, Headphones } from "lucide-react";

export default function PluginDetail() {
  return (
    <main className="pt-20 min-h-screen">
      {/* Hero Section: Demo Player */}
      <section className="relative w-full aspect-video md:h-[600px] bg-surface-container-lowest overflow-hidden group">
        <img
          src="https://picsum.photos/seed/neural-demo/1920/1080?grayscale"
          alt="Plugin Demo"
          className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40"></div>
        {/* Play Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button className="w-24 h-24 flex items-center justify-center border-2 border-primary-container bg-black/40 backdrop-blur-md hover:scale-110 hover:bg-primary-container hover:text-on-primary transition-all duration-500 group/play">
            <Play fill="currentColor" size={48} />
          </button>
        </div>
        {/* Video Progress Bar */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10">
          <div className="h-full bg-primary-container neon-glow-primary w-1/3"></div>
        </div>
      </section>

      {/* Content Grid */}
      <section className="max-w-screen-2xl mx-auto px-8 py-20 grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Left Column: Info & Features */}
        <div className="lg:col-span-8 space-y-16">
          <header>
            <div className="flex items-center space-x-4 mb-6">
              <span className="w-2 h-2 bg-secondary-container animate-pulse shadow-[0_0_8px_rgba(179,0,255,1)]"></span>
              <span className="font-headline text-secondary tracking-[0.3em] text-xs uppercase">Premium Plugin / v2.4.0</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-headline font-black tracking-tighter uppercase leading-none mb-8">
              NEURAL<br /><span className="text-primary-container">SYNAPSE</span>
            </h1>
            <p className="text-xl text-on-surface-variant font-body font-light leading-relaxed max-w-2xl">
              A generative visual feedback engine designed for real-time performance. Neural Synapse translates audio frequency bands into complex geometric lattices, creating a biological-digital hybrid aesthetic.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h3 className="font-headline text-lg tracking-widest uppercase border-l-4 border-primary-container pl-4">Core Features</h3>
              <ul className="space-y-4 text-on-surface-variant">
                <li className="flex items-start space-x-3">
                  <Terminal className="text-primary mt-1" size={16} />
                  <span>Native Resolume FFGL 2.0 implementation</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Waves className="text-primary mt-1" size={16} />
                  <span>Multi-band Audio Reactive Geometry</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Sparkles className="text-primary mt-1" size={16} />
                  <span>GPU-accelerated Particle Feedback loops</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Settings className="text-primary mt-1" size={16} />
                  <span>64 Automatable Parameters via OSC</span>
                </li>
              </ul>
            </div>
            <div className="space-y-6">
              <h3 className="font-headline text-lg tracking-widest uppercase border-l-4 border-secondary-container pl-4">VJ Workflow</h3>
              <ul className="space-y-4 text-on-surface-variant">
                <li className="flex items-start space-x-3">
                  <Gauge className="text-secondary mt-1" size={16} />
                  <span>Zero-latency performance at 4K 60FPS</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Layers className="text-secondary mt-1" size={16} />
                  <span>Seamless Alpha Channel transparency</span>
                </li>
                <li className="flex items-start space-x-3">
                  <Cpu className="text-secondary mt-1" size={16} />
                  <span>VRAM optimized for large-scale LED walls</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-4 gap-4 h-[400px]">
            <div className="col-span-2 row-span-2 bg-surface-container-lowest">
              <img src="https://picsum.photos/seed/n1/600/600" alt="Gallery 1" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
            </div>
            <div className="col-span-2 bg-surface-container-lowest">
              <img src="https://picsum.photos/seed/n2/600/300" alt="Gallery 2" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
            </div>
            <div className="bg-surface-container-lowest">
              <img src="https://picsum.photos/seed/n3/300/300" alt="Gallery 3" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
            </div>
            <div className="bg-surface-container-lowest">
              <img src="https://picsum.photos/seed/n4/300/300" alt="Gallery 4" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar Actions */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-surface-container-lowest p-8 border-t-2 border-primary-container neon-glow-primary">
            <div className="flex justify-between items-end mb-10">
              <div>
                <span className="text-on-surface-variant font-body text-xs uppercase tracking-widest">Single License</span>
                <div className="text-5xl font-headline font-black mt-2 text-white">$79.00</div>
              </div>
              <ShoppingCart className="text-primary" size={40} />
            </div>
            <div className="space-y-4">
              <button className="w-full py-5 bg-primary-container text-on-primary font-headline font-bold tracking-widest text-sm hover:brightness-110 transition-all flex items-center justify-center space-x-3">
                <CreditCard size={20} />
                <span>BUY WITH CARD</span>
              </button>
              <button className="w-full py-5 border border-secondary-container text-white font-headline font-bold tracking-widest text-sm hover:bg-secondary-container/10 transition-all flex items-center justify-center space-x-3">
                <Bitcoin size={20} />
                <span>BUY WITH CRYPTO</span>
              </button>
            </div>
            <div className="mt-8 pt-8 border-t border-white/5">
              <span className="text-[10px] text-gray-500 font-body tracking-[0.2em] uppercase block mb-4">Secure Crypto Network</span>
              <div className="flex justify-between items-center opacity-40 hover:opacity-100 transition-opacity">
                {['BTC', 'ETH', 'USDT', 'USDC', 'SOL'].map(coin => (
                  <div key={coin} className="flex flex-col items-center">
                    <div className="w-6 h-6 bg-gray-600 rounded-full mb-1"></div>
                    <span className="text-[8px]">{coin}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low p-8 border-l border-white/5 space-y-6">
            <h3 className="font-headline tracking-widest text-xs uppercase text-primary">System Requirements</h3>
            <div className="space-y-6">
              {[
                { label: "Software", value: "Resolume 7.14+" },
                { label: "Operating System", value: "Windows 10 / macOS 11+" },
                { label: "GPU", value: "GTX 1060 / M1 or higher" },
                { label: "Storage", value: "150 MB" },
                { label: "Format", value: ".vpkg (One-click Install)" },
              ].map(spec => (
                <div key={spec.label} className="flex justify-between items-center border-b border-white/5 pb-3">
                  <span className="text-xs text-on-surface-variant uppercase tracking-tighter">{spec.label}</span>
                  <span className="text-xs font-bold text-white">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 border border-white/5 bg-surface-container-lowest/50 text-center">
            <Headphones className="text-secondary-container mx-auto mb-4" size={32} />
            <p className="text-xs text-on-surface-variant leading-relaxed">Need custom integration for a specific stage setup? Contact our technical team.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
