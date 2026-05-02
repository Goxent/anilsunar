import React, { useState, useEffect, useContext } from 'react';
import { Menu, X } from 'lucide-react';
import { NAV_ITEMS } from '../constants';
import { Link } from 'react-router-dom';
import { SiteSettingsContext } from '../App';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dynamicSettings = useContext(SiteSettingsContext);

  const visibleSections = dynamicSettings?.sections || [];
  
  const activeNavItems = NAV_ITEMS.filter(item => {
    if (item.href === '#home') return true;
    if (item.href === '#contact') return true;
    const sectionId = item.href.replace('#', '');
    const mapping: Record<string, string> = {
      'writing': 'posts',
      'creative': 'creative',
      'about': 'about',
      'experience': 'experience',
      'projects': 'projects',
      'courses': 'courses'
    };
    const targetId = mapping[sectionId] || sectionId;
    const section = visibleSections.find((s: any) => s.id === targetId);
    return section ? section.visible : true;
  });

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-500 ${isScrolled
          ? 'py-4 bg-surface-950 border-b border-white/10 shadow-2xl'
          : 'py-6 bg-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-8 md:px-16 lg:px-24 flex justify-between items-center">
        <a href="#home" className="text-2xl font-serif font-bold tracking-tight text-white hover:text-accent-500 transition-colors">
          Anil Sunar
        </a>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {activeNavItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors relative group"
            >
              {item.label}
              <span className="absolute -bottom-2 left-0 w-0 h-[2px] bg-accent-500 transition-all duration-300 group-hover:w-full"></span>
            </a>
          ))}
          <a href="#contact" className="ml-4 px-8 md:px-16 lg:px-24 py-2.5 rounded-full border border-accent-500 text-accent-500 hover:bg-accent-500 hover:text-surface-950 transition-all duration-300 text-[11px] font-bold tracking-[0.2em] uppercase">
            Hire Me
          </a>
        </div>

        {/* Mobile */}
        <button
          className="md:hidden text-white hover:text-accent-500 transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden absolute top-full left-0 w-full bg-surface-950 border-b border-white/10 transition-all duration-300 overflow-hidden ${
          isMobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="flex flex-col py-6 px-8 md:px-16 lg:px-24 gap-5">
          {activeNavItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-[13px] font-bold uppercase tracking-[0.2em] text-slate-300 hover:text-accent-500 transition-colors border-b border-white/5 pb-3"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <a href="#contact" className="mt-4 text-center px-8 md:px-16 lg:px-24 py-3.5 bg-accent-500 text-surface-950 rounded-full font-bold uppercase tracking-[0.2em] text-[13px]" onClick={() => setIsMobileMenuOpen(false)}>
            Hire Me
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
