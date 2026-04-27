import React from 'react';
import settings from '../src/content/settings.json';

const Hero: React.FC = () => {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center overflow-hidden hero-bg"
    >
      <div className="max-w-7xl mx-auto px-8 md:px-16 lg:px-24 w-full relative z-10 pt-20">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          {/* Left: Text */}
          <div className="fade-in order-2 md:order-1">
            <p className="text-accent-500 text-xs font-semibold tracking-[0.4em] uppercase mb-6 opacity-0" style={{ animation: 'fadeIn 0.6s ease-out forwards 0.2s' }}>
              {settings.hero?.title || 'Chartered Accountant · Audit Manager · Creator'}
            </p>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-white mb-6 leading-[0.95] tracking-tight opacity-0" style={{ animation: 'fadeIn 0.6s ease-out forwards 0.4s' }}>
              Anil<br />
              <span className="text-gradient-accent">Sunar</span>
            </h1>

            <div className="h-px w-20 bg-gradient-to-r from-accent-500 to-transparent mb-8 opacity-0" style={{ animation: 'fadeIn 0.6s ease-out forwards 0.6s' }}></div>

            <p className="text-slate-400 text-lg md:text-xl max-w-md font-light leading-relaxed opacity-0" style={{ animation: 'fadeIn 0.6s ease-out forwards 0.8s' }}>
              {settings.hero?.subtitle || 'Bridging the precision of finance with the creativity of technology and words.'}
            </p>

            <div className="mt-12 flex flex-col sm:flex-row gap-5 opacity-0" style={{ animation: 'fadeIn 0.6s ease-out forwards 1s' }}>
              <a
                href="#experience"
                className="group px-8 py-4 rounded-full text-sm font-bold uppercase tracking-[0.2em] border border-white/10 hover:border-accent-500/40 hover:text-accent-500 transition-all duration-500 flex items-center justify-center bg-white/[0.03]"
              >
                View My Work
              </a>
              <a
                href="#contact"
                className="px-8 py-4 rounded-full text-sm font-bold uppercase tracking-[0.2em] bg-accent-500 text-black hover:bg-accent-300 transition-all duration-300 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]"
              >
                Let's Connect
              </a>
            </div>
          </div>

          {/* Right: Photo */}
          <div className="relative order-1 md:order-2 flex justify-center md:justify-end opacity-0" style={{ animation: 'fadeIn 0.8s ease-out forwards 0.3s' }}>
            <div className="relative">
              {/* Subtle glow behind photo */}
              <div className="absolute -inset-4 bg-gradient-to-br from-accent-500/10 via-transparent to-accent-500/5 rounded-3xl blur-2xl"></div>
              
              <div className="relative w-72 md:w-96 lg:w-[420px] rounded-3xl overflow-hidden" style={{ aspectRatio: '3/4' }}>
                <img
                  src="/anil-photo.png"
                  alt="Anil Sunar — Chartered Accountant & Creator"
                  className="w-full h-full object-cover"
                />
                
                {/* Gradient overlays to smoothly merge portrait into the black background */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-transparent opacity-40"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent opacity-60"></div>
                <div className="absolute inset-0 bg-gradient-to-l from-black via-transparent to-transparent opacity-60"></div>
                <div className="absolute inset-0 ring-1 ring-inset ring-white/5 rounded-3xl"></div>
              </div>

              {/* Small floating credential badge */}
              <div className="absolute bottom-4 left-4 bg-surface-950 border border-white/10 rounded-2xl px-5 py-4 shadow-2xl z-20 backdrop-blur-xl">
                <span className="text-accent-500 font-bold block tracking-widest text-[10px] uppercase mb-1">CA Nepal</span>
                <span className="text-slate-400 text-xs">ICAN Member</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
