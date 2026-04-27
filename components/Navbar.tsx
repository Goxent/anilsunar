import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { NAV_ITEMS } from '../constants';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-500 ${isScrolled
          ? 'py-3 bg-surface-950/90 backdrop-blur-xl border-b border-white/[0.06]'
          : 'py-5 bg-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <a href="#home" className="text-xl font-serif font-bold tracking-tight text-white hover:text-accent-300 transition-colors">
          Anil Sunar
        </a>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-[13px] uppercase tracking-[0.15em] text-slate-400 hover:text-accent-300 transition-colors relative group font-medium"
            >
              {item.label}
              <span className="absolute -bottom-1.5 left-0 w-0 h-px bg-accent-400 transition-all duration-300 group-hover:w-full"></span>
            </a>
          ))}
          <Link
            to="/app"
            className="text-[13px] uppercase tracking-[0.15em] text-accent-400 hover:text-accent-300 transition-colors font-semibold"
          >
            Dashboard
          </Link>
          <a href="#contact" className="ml-2 px-5 py-2 rounded-full border border-accent-400/30 text-accent-400 hover:bg-accent-400 hover:text-surface-950 transition-all duration-300 text-[13px] font-semibold tracking-wider uppercase">
            Hire Me
          </a>
        </div>

        {/* Mobile */}
        <button
          className="md:hidden text-white hover:text-accent-300 transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden absolute top-full left-0 w-full bg-surface-950/95 backdrop-blur-xl border-b border-white/[0.06] transition-all duration-300 overflow-hidden ${
          isMobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="flex flex-col py-6 px-6 gap-5">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-base text-slate-300 hover:text-accent-300 transition-colors border-b border-white/5 pb-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <Link
            to="/app"
            className="text-base text-accent-400 hover:text-accent-300 transition-colors border-b border-white/5 pb-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Dashboard
          </Link>
          <a href="#contact" className="mt-2 text-center px-6 py-3 bg-accent-400 text-surface-950 rounded-full font-bold uppercase tracking-wider">
            Hire Me
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;