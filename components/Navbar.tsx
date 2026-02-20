import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { NAV_ITEMS } from '../constants';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-500 ${isScrolled
        ? 'bg-luxury-950/80 backdrop-blur-lg border-b border-white/5 py-4 shadow-[0_4px_30px_rgba(0,0,0,0.1)]'
        : 'bg-transparent py-6'
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <a href="#home" className="text-2xl font-serif font-bold tracking-tighter hover:text-gold-500 transition-colors">
          Anil<span className="text-gold-500">.</span>
        </a>

        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-8">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-xs uppercase tracking-[0.2em] font-medium text-slate-400 hover:text-white transition-colors duration-300 relative group py-2"
            >
              {item.label}
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-gold-500 transition-all duration-300 group-hover:w-full"></span>
            </a>
          ))}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-white hover:text-gold-500 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden absolute top-full left-0 w-full bg-luxury-950/95 backdrop-blur-xl border-b border-white/10 p-6 flex flex-col space-y-4 shadow-2xl"
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-lg font-serif text-slate-200 hover:text-gold-400 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;