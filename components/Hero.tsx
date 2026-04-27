import React from 'react';
import settings from '../src/content/settings.json';

const Hero: React.FC = () => {
  return (
    <section
      id="home"
      className="relative min-h-[100vh] flex items-center justify-center overflow-hidden hero-bg pt-20"
    >
      {/* Decorative ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-500/[0.03] rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto px-6 w-full relative z-10 flex flex-col items-center text-center">
        
        {/* Photo Container */}
        <div className="mb-12 relative fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="absolute -inset-4 bg-gradient-to-b from-accent-500/20 to-transparent rounded-full blur-2xl opacity-50"></div>
          <div className="relative w-40 h-40 md:w-56 md:h-56 rounded-full p-1 bg-gradient-to-b from-accent-500/50 to-white/5">
            <img
              src="/anil-photo.png"
              alt="Anil Sunar"
              className="w-full h-full object-cover rounded-full bg-surface-900 border-[4px] border-surface-950"
            />
          </div>
          {/* Subtle Credential Badge */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-surface-950 border border-white/10 rounded-full px-5 py-1.5 shadow-2xl">
            <span className="text-[10px] font-bold uppercase tracking-widest text-accent-500">CA Nepal · ICAN</span>
          </div>
        </div>

        {/* Text Content */}
        <div className="fade-in" style={{ animationDelay: '0.4s' }}>
          <p className="text-accent-500 text-xs font-bold tracking-[0.4em] uppercase mb-6">
            {settings.hero?.title || 'Chartered Accountant · Audit Manager · Creator'}
          </p>

          <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif font-bold text-white mb-8 leading-[0.9] tracking-tight">
            Anil <span className="text-gradient-accent">Sunar</span>
          </h1>

          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed mb-12">
            {settings.hero?.subtitle || 'Bridging the precision of finance with the creativity of technology and words.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            <a
              href="#experience"
              className="group px-8 py-4 rounded-full text-xs font-bold uppercase tracking-[0.2em] border border-white/10 hover:border-accent-500/40 hover:text-accent-500 transition-all duration-500 flex items-center justify-center bg-white/[0.02]"
            >
              View My Work
            </a>
            <a
              href="#contact"
              className="px-8 py-4 rounded-full text-xs font-bold uppercase tracking-[0.2em] bg-accent-500 text-surface-950 hover:bg-accent-300 transition-all duration-300 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]"
            >
              Let's Connect
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;