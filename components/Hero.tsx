import React from 'react';
import { ArrowDown } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden hero-bg"
    >
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto fade-in">
        <h2 className="text-gold-500 text-sm md:text-sm font-semibold tracking-[0.4em] uppercase mb-6 opacity-0" style={{ animation: 'fadeIn 0.6s ease-out forwards 0.2s' }}>
          Chartered Accountant · Audit Manager · Creator
        </h2>

        <h1 className="text-6xl md:text-9xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50 mb-6 leading-tight opacity-0" style={{ animation: 'fadeIn 0.6s ease-out forwards 0.4s' }}>
          Anil Sunar
        </h1>

        <div className="h-px w-32 bg-gradient-to-r from-transparent via-gold-500 to-transparent mx-auto mb-8 opacity-0" style={{ animation: 'fadeIn 0.6s ease-out forwards 0.6s' }}></div>

        <p className="text-slate-400 text-lg md:text-2xl max-w-2xl mx-auto font-light leading-relaxed opacity-0" style={{ animation: 'fadeIn 0.6s ease-out forwards 0.8s' }}>
          CA from ICAN, Nepal · Audit Manager · Tech Builder · Poet & Rapper <br />
          <span className="text-base md:text-xl mt-4 block text-slate-300">Bridging the precision of finance with the creativity of technology and words.</span>
        </p>

        <div className="mt-14 flex flex-col md:flex-row gap-6 justify-center items-center opacity-0" style={{ animation: 'fadeIn 0.6s ease-out forwards 1s' }}>
          <a
            href="#experience"
            className="group relative px-8 py-4 rounded-full text-sm uppercase tracking-widest border border-white/20 hover:border-gold-500/50 hover:text-gold-400 transition-all duration-500 w-56 flex items-center justify-center overflow-hidden bg-white/5"
          >
            <span className="relative z-10">View My Work</span>
            <div className="absolute inset-0 h-full w-full scale-0 rounded-full transition-all duration-500 group-hover:scale-100 group-hover:bg-white/5"></div>
          </a>
          <a
            href="#contact"
            className="relative px-8 py-4 rounded-full text-sm uppercase tracking-widest bg-gold-500 text-luxury-950 font-bold hover:bg-gold-400 transition-all duration-300 w-56 flex items-center justify-center group border border-transparent hover:border-gold-300"
          >
            Let's Connect
            <div className="absolute inset-0 rounded-full border border-gold-400 scale-105 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"></div>
          </a>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
        <ArrowDown size={24} className="text-gold-500/50" />
      </div>
    </section>
  );
};

export default Hero;