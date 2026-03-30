import { Instagram, Youtube, Github, Disc as Discord, Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#0E0E0E] border-t border-white/5 py-12 px-12 transition-all duration-500">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="mb-8 md:mb-0">
          <div className="text-white font-headline font-black tracking-widest text-xl mb-2 uppercase">INNSAEI</div>
          <p className="font-body text-[10px] tracking-widest uppercase text-gray-600">
            © 2024 INNSAEI STUDIOS. VISUAL INTELLIGENCE.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-8 font-body text-[10px] tracking-widest uppercase">
          <a href="#" className="text-gray-600 hover:text-purple-400 transition-colors">Instagram</a>
          <a href="#" className="text-gray-600 hover:text-purple-400 transition-colors">Vimeo</a>
          <a href="#" className="text-gray-600 hover:text-purple-400 transition-colors">Behance</a>
          <a href="#" className="text-gray-600 hover:text-purple-400 transition-colors">Discord</a>
        </div>
        <div className="mt-8 md:mt-0 flex items-center gap-4">
          <Zap size={16} className="text-purple-600" />
          <span className="text-white font-body text-[10px] tracking-widest uppercase">Live Feeds Active</span>
          <div className="w-2 h-2 rounded-full bg-secondary-container animate-pulse shadow-[0_0_8px_rgba(179,0,255,1)]"></div>
        </div>
      </div>
    </footer>
  );
}
