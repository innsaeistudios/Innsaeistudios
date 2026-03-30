import { motion } from "motion/react";
import { Terminal, Key, ShieldCheck, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Login() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-20 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-container/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-container/10 rounded-full blur-[120px]"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md bg-surface-container-lowest border border-white/5 p-8 md:p-12 shadow-2xl"
      >
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-surface-container-high border border-white/10 mb-6 group">
            <ShieldCheck className="text-primary-container group-hover:scale-110 transition-transform" size={32} />
          </div>
          <h1 className="font-headline text-3xl font-black tracking-tighter uppercase text-white mb-2 italic">Visual Access</h1>
          <p className="text-on-surface-variant font-body text-xs tracking-widest uppercase">Initialize Secure Session</p>
        </div>

        <form className="space-y-8">
          <div className="space-y-2">
            <label className="flex items-center gap-2 font-headline text-[10px] tracking-[0.2em] uppercase text-primary-container">
              <Terminal size={14} />
              Terminal Identifier
            </label>
            <input
              type="text"
              placeholder="USER_ID_082"
              className="w-full bg-surface-container-low border border-white/10 py-4 px-6 focus:ring-0 focus:border-primary-container text-white font-mono text-sm placeholder:text-gray-700 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 font-headline text-[10px] tracking-[0.2em] uppercase text-primary-container">
              <Key size={14} />
              Access Key
            </label>
            <input
              type="password"
              placeholder="••••••••••••"
              className="w-full bg-surface-container-low border border-white/10 py-4 px-6 focus:ring-0 focus:border-primary-container text-white font-mono text-sm placeholder:text-gray-700 transition-all"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-primary-container text-on-primary font-headline font-bold uppercase tracking-widest py-5 text-sm neon-glow-blue transition-all hover:brightness-110 flex items-center justify-center gap-3"
            >
              Initialize Session
              <ArrowRight size={18} />
            </button>
          </div>
        </form>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
          <Link to="/contact" className="text-[10px] font-headline tracking-[0.2em] uppercase text-on-surface-variant hover:text-white transition-colors">
            Request Credentials
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 bg-secondary-container rounded-full animate-pulse"></div>
            <span className="text-[8px] font-mono tracking-[0.3em] uppercase text-gray-600 italic">Encrypted Link Active</span>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
