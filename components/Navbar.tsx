import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { NAV_ITEMS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import Magnetic from './Magnetic';

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
    <motion.nav
      className={`fixed w-full z-50 transition-all duration-500 rounded-b-3xl ${isScrolled
          ? 'py-4 bg-luxury-950/70 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]'
          : 'py-6 bg-transparent'
        }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <Magnetic>
          <a href="#home" className="text-2xl font-serif font-bold tracking-tighter text-white hover:text-gold-500 transition-colors">
            Goxent<span className="text-gold-500">.</span>
          </a>
        </Magnetic>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <Magnetic key={item.label}>
              <a
                href={item.href}
                className="text-sm uppercase tracking-widest text-slate-300 hover:text-gold-400 transition-colors relative group font-medium"
              >
                {item.label}
                <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-gold-500 transition-all duration-300 group-hover:w-full"></span>
              </a>
            </Magnetic>
          ))}
          <Magnetic>
            <a href="#contact" className="ml-4 px-6 py-2.5 rounded-full border border-gold-500/50 text-gold-500 hover:bg-gold-500 hover:text-luxury-950 transition-all duration-300 text-sm font-semibold tracking-wider uppercase shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)]">
              Hire Me
            </a>
          </Magnetic>
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
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="md:hidden absolute top-full left-0 w-full bg-luxury-900/95 backdrop-blur-2xl border-b border-white/10"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
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
              <a href="#contact" className="mt-4 text-center px-6 py-3 bg-gold-500 text-luxury-950 rounded-full font-bold uppercase tracking-wider">
                Hire Me
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;