import React, { useState, useEffect } from 'react';
import { Menu, X, Lock } from 'lucide-react';
import { NAV_ITEMS } from '../constants';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-500 rounded-b-3xl ${isScrolled
          ? 'py-4 bg-[#0a0a0f]/80 border-b border-white/10 shadow-lg'
          : 'py-6 bg-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <a href="#home" className="text-2xl font-serif font-bold tracking-tighter text-white hover:text-gold-500 transition-colors">
            Anil Sunar
          </a>
          <span className="text-[10px] uppercase tracking-[0.2em] px-2 py-1 bg-gold-500/10 text-gold-500 border border-gold-500/20 rounded-md font-bold">
            Goxent.
          </span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm uppercase tracking-widest text-slate-300 hover:text-gold-400 transition-colors relative group font-medium"
            >
              {item.label}
              <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-gold-500 transition-all duration-300 group-hover:w-full"></span>
            </a>
          ))}
          <Link
            to="/app"
            className="flex items-center gap-2 text-sm uppercase tracking-widest text-gold-400 hover:text-gold-500 transition-colors font-bold"
          >
            <Lock size={14} />
            App
          </Link>
          <a href="#contact" className="ml-4 px-6 py-2.5 rounded-full border border-gold-500/50 text-gold-500 hover:bg-gold-500 hover:text-luxury-950 transition-all duration-300 text-sm font-semibold tracking-wider uppercase">
            Hire Me
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white hover:text-gold-500 transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden absolute top-full left-0 w-full bg-[#0a0a0f]/95 border-b border-white/10 transition-all duration-300 overflow-hidden ${
          isMobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="flex flex-col py-6 px-6 gap-6">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-lg font-serif text-slate-200 hover:text-gold-400 transition-colors border-b border-white/5 pb-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <Link
            to="/app"
            className="flex items-center gap-3 text-lg font-serif text-gold-400 hover:text-gold-500 transition-colors border-b border-white/5 pb-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Lock size={18} />
            Command Center
          </Link>
          <a href="#contact" className="mt-4 text-center px-6 py-3 bg-gold-500 text-luxury-950 rounded-full font-bold uppercase tracking-wider">
            Hire Me
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;