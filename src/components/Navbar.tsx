import { Link, useLocation } from "react-router-dom";
import { User } from "lucide-react";
import { motion } from "motion/react";

export default function Navbar() {
  const location = useLocation();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Gallery", path: "/gallery" },
    { name: "Plugins", path: "/store" },
    { name: "About", path: "/#about" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <header className="fixed top-0 w-full z-50 bg-black/70 backdrop-blur-xl border-b border-white/10 flex justify-between items-center px-8 h-20">
      <Link to="/" className="text-2xl font-black tracking-widest text-white font-headline uppercase">
        INNSAEI
      </Link>
      <nav className="hidden md:flex items-center space-x-8 font-headline tracking-tighter uppercase text-sm">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            to={link.path}
            className={`transition-colors hover:text-cyan-300 hover:drop-shadow-[0_0_8px_rgba(0,207,255,0.8)] ${
              location.pathname === link.path ? "text-cyan-400 border-b-2 border-cyan-400 pb-1" : "text-gray-400"
            }`}
          >
            {link.name}
          </Link>
        ))}
      </nav>
      <div className="flex items-center space-x-4">
        <Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors">
          <User size={24} />
        </Link>
        <Link
          to="/login"
          className="bg-primary-container text-on-primary px-6 py-2 text-xs font-bold tracking-widest hover:brightness-110 transition-all uppercase"
        >
          Login
        </Link>
      </div>
    </header>
  );
}
