import { motion } from "motion/react";
import { ArrowRight, Rocket, Brush } from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
  const featuredWork = [
    { id: 1, category: "CLUBS", title: "Afterlife Experience", image: "https://picsum.photos/seed/afterlife/800/450" },
    { id: 2, category: "CONCERTS", title: "Neon Pulse World Tour", image: "https://picsum.photos/seed/neon/800/450" },
    { id: 3, category: "MAPPING", title: "Heritage Light Up", image: "https://picsum.photos/seed/heritage/800/450" },
    { id: 4, category: "LOGOS", title: "Brand Ident Visuals", image: "https://picsum.photos/seed/brand/800/450" },
    { id: 5, category: "FESTIVALS", title: "Sectio Aurea Live", image: "https://picsum.photos/seed/sectio/800/450" },
    { id: 6, category: "CUSTOM", title: "Void Residency", image: "https://picsum.photos/seed/void/800/450" },
  ];

  const plugins = [
    {
      id: 1,
      title: "Void FX Pack 01",
      price: "$49.00",
      features: ["12 Resolume FFGL Plugins", "Real-time Audio Reactive", "4K Ultra-Low Latency"],
      image: "https://picsum.photos/seed/fx1/400/400",
      color: "border-primary-container",
      btnColor: "bg-primary-container",
    },
    {
      id: 2,
      title: "Cyber-Geometry Loops",
      price: "$89.00",
      features: ["50 Seamless DXV3 Loops", "HAP Alpha Transparency", "BPM Sync Ready"],
      image: "https://picsum.photos/seed/loops/400/400",
      color: "border-secondary-container",
      btnColor: "bg-secondary-container",
    },
    {
      id: 3,
      title: "Studio Master Bundle",
      price: "$199.00",
      features: ["Full VJ Ecosystem Access", "Priority Live Support", "Lifetime Free Updates"],
      image: "https://picsum.photos/seed/bundle/400/400",
      color: "border-primary-container",
      btnColor: "bg-primary-container",
    },
  ];

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://picsum.photos/seed/innsaei-hero/1920/1080?blur=4"
            alt="Hero Background"
            className="w-full h-full object-cover opacity-50 brightness-50"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black"></div>
        </div>
        <div className="relative z-10 text-center px-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-headline font-black text-6xl md:text-9xl tracking-[0.2em] text-white uppercase mb-4"
          >
            INNSAEI STUDIOS
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-body text-on-surface-variant text-lg md:text-2xl tracking-widest uppercase mb-12 max-w-3xl mx-auto"
          >
            India’s Leading Visual Jockeys & Motion Artists
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col md:flex-row gap-6 justify-center"
          >
            <Link
              to="/gallery"
              className="px-10 py-4 border border-primary-container text-primary-container font-headline font-bold uppercase tracking-widest neon-glow-blue transition-all bg-black/40 hover:bg-primary-container hover:text-on-primary"
            >
              Gallery
            </Link>
            <Link
              to="/store"
              className="px-10 py-4 border border-secondary-container text-secondary-container font-headline font-bold uppercase tracking-widest transition-all hover:bg-secondary-container hover:text-white shadow-[0_0_15px_rgba(179,0,255,0.2)]"
            >
              Plugins Store
            </Link>
          </motion.div>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50">
          <span className="text-[10px] tracking-[0.3em] uppercase">Explore Void</span>
          <motion.div
            animate={{ height: [0, 48, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-px bg-gradient-to-b from-primary-container to-transparent"
          ></motion.div>
        </div>
      </section>

      {/* Featured Work */}
      <section className="py-24 bg-black">
        <div className="px-8 mb-12 flex justify-between items-end">
          <div>
            <h2 className="font-headline text-4xl font-bold uppercase tracking-tighter text-white mb-2">Featured Work</h2>
            <div className="h-1 w-24 bg-primary-container"></div>
          </div>
          <div className="hidden md:flex gap-4 font-body text-[10px] tracking-widest uppercase text-on-surface-variant">
            <span>Clubs</span> / <span>Concerts</span> / <span>Projection Mapping</span> / <span>Custom Visuals</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {featuredWork.map((work) => (
            <div key={work.id} className="group relative aspect-video overflow-hidden cursor-pointer bg-surface-container-lowest">
              <img
                src={work.image}
                alt={work.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/60 group-hover:bg-black/20 transition-all flex flex-col justify-end p-8">
                <span className="text-primary-container text-[10px] font-bold tracking-widest mb-2">{work.category}</span>
                <h3 className="font-headline text-2xl font-bold text-white uppercase transform translate-y-4 group-hover:translate-y-0 transition-transform">
                  {work.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Engineered Tools */}
      <section className="py-24 bg-[#0E0E0E]">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16">
            <div className="max-w-xl">
              <h2 className="font-headline text-5xl font-black uppercase tracking-tighter text-white mb-6">Engineered Tools</h2>
              <p className="text-on-surface-variant font-body leading-relaxed">
                Pro-grade Resolume FX, custom VJ loops, and generative content packs designed for the world's biggest stages.
              </p>
            </div>
            <Link
              to="/store"
              className="mt-8 md:mt-0 group flex items-center gap-2 text-primary-container font-headline font-bold uppercase tracking-widest"
            >
              View Entire Store
              <ArrowRight className="transition-transform group-hover:translate-x-2" size={18} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plugins.map((plugin) => (
              <div
                key={plugin.id}
                className={`bg-surface-container-low border-b-2 ${plugin.color} p-1 transition-all hover:translate-y-[-8px]`}
              >
                <div className="bg-black p-6 flex flex-col h-full">
                  <div className="aspect-square bg-surface-container-lowest mb-6 overflow-hidden">
                    <img
                      src={plugin.image}
                      alt={plugin.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h4 className="font-headline text-xl font-bold text-white uppercase mb-4">{plugin.title}</h4>
                  <ul className="text-xs space-y-2 mb-8 text-on-surface-variant font-body uppercase tracking-widest">
                    {plugin.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <div className={`w-1 h-1 ${plugin.btnColor}`}></div> {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/10">
                    <span className="font-headline font-bold text-white">{plugin.price}</span>
                    <button className={`${plugin.btnColor} text-on-primary font-bold text-[10px] py-2 px-4 uppercase tracking-widest hover:brightness-110`}>
                      Buy Now (Crypto + Card)
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 bg-black border-y border-white/5">
        <div className="max-w-5xl mx-auto px-8 text-center">
          <div className="inline-block px-4 py-1 border border-primary-container/30 text-primary-container text-[10px] font-bold tracking-[0.4em] uppercase mb-12">
            Visual Intelligence
          </div>
          <h2 className="font-headline text-3xl md:text-5xl font-light text-white leading-tight mb-12">
            Innsaei Studios is India’s No.1 VJ and Visual Arts team, delivering{" "}
            <span className="text-primary-container font-bold">award-winning motion graphics</span>, live visuals, and projection mapping for global events.
          </h2>
          <p className="text-on-surface-variant font-body text-lg leading-relaxed max-w-3xl mx-auto mb-16">
            Our artists have worked with <span className="text-white">Afterlife</span>, <span className="text-white">Sectio Aurea</span>, and leading stages worldwide. We transform physical spaces into immersive digital realms through engineered precision.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
            {[1, 2, 3, 4].map((i) => (
              <img
                key={i}
                src={`https://picsum.photos/seed/client-${i}/200/100`}
                alt="Client Logo"
                className="h-12 mx-auto object-contain"
                referrerPolicy="no-referrer"
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 bg-black overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20">
          <img
            src="https://picsum.photos/seed/cta-bg/1920/600"
            alt="CTA Background"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-8 text-center">
          <h2 className="font-headline text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-8">Ready to Elevate?</h2>
          <div className="flex flex-col md:flex-row gap-6 justify-center">
            <button className="group flex items-center justify-center gap-4 bg-primary-container text-on-primary font-headline font-bold text-lg py-5 px-10 tracking-widest transition-all neon-glow-blue">
              WORK WITH US
              <Rocket className="transition-transform group-hover:translate-x-2" size={24} />
            </button>
            <button className="group flex items-center justify-center gap-4 border border-white/20 text-white font-headline font-bold text-lg py-5 px-10 tracking-widest transition-all hover:bg-white hover:text-black">
              GET CUSTOM VISUALS
              <Brush size={24} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
