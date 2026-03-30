import { Send, MapPin, Mail, Zap } from "lucide-react";

export default function Contact() {
  return (
    <main className="pt-32 pb-20 px-6 md:px-12 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="mb-24">
        <h1 className="font-headline text-6xl md:text-8xl font-bold uppercase tracking-tighter leading-none mb-6">
          Connect <span className="text-primary-container">Intelligence</span>
        </h1>
        <p className="text-on-surface-variant max-w-xl text-lg tracking-wide">
          Reach out for collaboration, project inquiries, or to book our visual systems for your next event. We transform signals into immersive experiences.
        </p>
      </section>

      {/* Asymmetric Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Contact Form */}
        <div className="lg:col-span-7 bg-surface-container-lowest p-8 md:p-12 border-l border-primary-container/20">
          <form className="space-y-12">
            <div className="relative">
              <label className="block font-headline text-xs uppercase tracking-[0.2em] text-primary-container mb-4">Identity / Name</label>
              <input
                type="text"
                placeholder="ENTER YOUR FULL NAME"
                className="w-full bg-transparent border-0 border-b border-white/20 py-4 px-0 focus:ring-0 focus:border-primary-container text-white font-headline text-xl placeholder:text-gray-800 transition-all"
              />
            </div>
            <div className="relative">
              <label className="block font-headline text-xs uppercase tracking-[0.2em] text-primary-container mb-4">Signal / Email Address</label>
              <input
                type="email"
                placeholder="EMAIL@DOMAIN.COM"
                className="w-full bg-transparent border-0 border-b border-white/20 py-4 px-0 focus:ring-0 focus:border-primary-container text-white font-headline text-xl placeholder:text-gray-800 transition-all"
              />
            </div>
            <div className="relative">
              <label className="block font-headline text-xs uppercase tracking-[0.2em] text-primary-container mb-4">Transmission / Project Details</label>
              <textarea
                rows={4}
                placeholder="DESCRIBE THE VISION, SCALE, AND TIMELINE..."
                className="w-full bg-transparent border-0 border-b border-white/20 py-4 px-0 focus:ring-0 focus:border-primary-container text-white font-headline text-xl placeholder:text-gray-800 transition-all resize-none"
              ></textarea>
            </div>
            <div className="pt-8">
              <button
                type="submit"
                className="group relative w-full md:w-auto bg-primary-container text-on-primary font-headline font-bold uppercase tracking-widest px-12 py-5 text-sm neon-glow-blue transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
              >
                Send Transmission
                <Send className="group-hover:translate-x-2 transition-transform" size={20} />
              </button>
            </div>
          </form>
        </div>

        {/* Side Info & Map */}
        <div className="lg:col-span-5 space-y-12">
          {/* Location Info */}
          <div className="bg-surface-container-low p-8 border-t border-secondary-container/30">
            <h3 className="font-headline text-2xl font-bold uppercase mb-8 tracking-tight">System Node</h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <MapPin className="text-secondary-container" size={24} />
                <div>
                  <p className="text-xs uppercase tracking-widest text-on-surface-variant mb-1">Base of Operations</p>
                  <p className="font-headline text-lg text-white">Berlin, Digital District 01</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Mail className="text-secondary-container" size={24} />
                <div>
                  <p className="text-xs uppercase tracking-widest text-on-surface-variant mb-1">Direct Link</p>
                  <p className="font-headline text-lg text-white">nexus@innsaei.studio</p>
                </div>
              </div>
            </div>
          </div>

          {/* Minimal Dark Map */}
          <div className="aspect-square w-full bg-surface-container-lowest overflow-hidden grayscale contrast-125 brightness-75 border border-white/5 relative">
            <img
              src="https://picsum.photos/seed/berlin-map/600/600?grayscale"
              alt="Berlin Map Overlay"
              className="w-full h-full object-cover opacity-50"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-primary-container/20 rounded-full flex items-center justify-center border border-primary-container animate-pulse">
                <div className="w-2 h-2 bg-primary-container rounded-full shadow-[0_0_10px_#00cfff]"></div>
              </div>
            </div>
            <div className="absolute bottom-4 left-4 bg-black/80 px-4 py-2 text-[10px] font-headline tracking-widest uppercase text-white backdrop-blur-md">
              LOC_COORDS: 52.5200° N, 13.4050° E
            </div>
          </div>

          {/* Live Status */}
          <div className="flex items-center gap-4 bg-surface-container-lowest p-6 border border-white/5">
            <div className="w-3 h-3 bg-secondary-container animate-pulse"></div>
            <p className="text-xs font-headline uppercase tracking-[0.3em] text-on-surface-variant">System Status: Receiving Signals</p>
          </div>
        </div>
      </div>
    </main>
  );
}
