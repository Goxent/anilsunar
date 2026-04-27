import React from 'react';
import { ArrowDown } from 'lucide-react';
import settings from '../src/content/settings.json';

const Hero: React.FC = () => {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center overflow-hidden hero-bg"
    >
      <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          {/* Left: Text */}
          <div className="fade-in order-2 md:order-1">
            <p className="text-accent-400 text-xs font-semibold tracking-[0.4em] uppercase mb-6 opacity-0" style={{ animation: 'fadeIn 0.6s ease-out forwards 0.2s' }}>
              {settings.hero?.title || 'Chartered Accountant · Audit Manager · Creator'}
            </p>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-white mb-6 leading-[0.95] tracking-tight opacity-0" style={{ animation: 'fadeIn 0.6s ease-out forwards 0.4s' }}>
              Anil<br />
              <span className="text-gradient-accent">Sunar</span>
            </h1>

            <div className="h-px w-20 bg-gradient-to-r from-accent-400 to-transparent mb-8 opacity-0" style={{ animation: 'fadeIn 0.6s ease-out forwards 0.6s' }}></div>

            <p className="text-slate-400 text-lg md:text-xl max-w-md font-light leading-relaxed opacity-0" style={{ animation: 'fadeIn 0.6s ease-out forwards 0.8s' }}>
              {settings.hero?.subtitle || 'Bridging the precision of finance with the creativity of technology and words.'}
            </p>

            <div className="mt-12 flex flex-col sm:flex-row gap-5 opacity-0" style={{ animation: 'fadeIn 0.6s ease-out forwards 1s' }}>
              <a
                href="#experience"
                className="group px-8 py-4 rounded-full text-sm uppercase tracking-widest border border-white/10 hover:border-accent-400/40 hover:text-accent-300 transition-all duration-500 flex items-center justify-center bg-white/[0.03]"
              >
                View My Work
              </a>
              <a
                href="#contact"
                className="px-8 py-4 rounded-full text-sm uppercase tracking-widest bg-accent-400 text-surface-950 font-bold hover:bg-accent-300 transition-all duration-300 flex items-center justify-center"
              >
                Let's Connect
              </a>
            </div>
          </div>

          {/* Right: Photo */}
          <div className="relative order-1 md:order-2 flex justify-center md:justify-end opacity-0" style={{ animation: 'fadeIn 0.8s ease-out forwards 0.3s' }}>
            <div className="relative">
              {/* Subtle glow behind photo */}
              <div className="absolute -inset-4 bg-gradient-to-br from-accent-400/10 via-transparent to-accent-500/5 rounded-3xl blur-2xl"></div>
              <img
                src="/Charcoal Blazer with New Hair.png"
                alt="Anil Sunar — Chartered Accountant & Creator"
                className="relative w-72 md:w-96 lg:w-[420px] rounded-2xl object-cover border border-white/[0.06]"
                style={{ aspectRatio: '3/4' }}
              />
              {/* Small floating credential badge */}
              <div className="absolute -bottom-4 -left-4 bg-surface-900 border border-white/10 rounded-xl px-4 py-3 text-xs">
                <span className="text-accent-400 font-bold block">CA Nepal</span>
                <span className="text-slate-500">ICAN Member</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;