import React from 'react';
import { ArrowDown } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-luxury-950">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <h2 className="text-gold-500 text-sm md:text-base font-bold tracking-[0.3em] uppercase mb-4 animate-[fadeInUp_1s_ease-out]">
          Portfolio
        </h2>
        <h1 className="text-5xl md:text-8xl font-serif font-bold text-white mb-6 leading-tight animate-[fadeInUp_1s_ease-out_0.2s_both]">
          Anil Sunar
        </h1>
        <div className="h-px w-24 bg-gold-500/50 mx-auto mb-8 animate-[fadeInUp_1s_ease-out_0.4s_both]"></div>
        <p className="text-slate-400 text-lg md:text-2xl max-w-2xl mx-auto font-light leading-relaxed animate-[fadeInUp_1s_ease-out_0.6s_both]">
          Bridging the precision of <span className="text-white font-medium">Accounting</span> with the rhythm of <span className="text-white font-medium">Poetry & Rap</span>.
        </p>
        
        <div className="mt-12 flex flex-col md:flex-row gap-4 justify-center items-center animate-[fadeInUp_1s_ease-out_0.8s_both]">
          <a 
            href="#about"
            className="px-8 py-3 rounded-full text-sm uppercase tracking-widest border border-white/20 hover:bg-white/5 hover:border-gold-500/50 hover:text-gold-400 transition-all duration-300 w-48"
          >
            Explore
          </a>
          <a 
            href="#contact"
            className="px-8 py-3 rounded-full text-sm uppercase tracking-widest bg-gold-500 text-black font-semibold hover:bg-gold-400 transition-all duration-300 w-48 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]"
          >
            Contact Me
          </a>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
        <ArrowDown size={24} />
      </div>
    </section>
  );
};

export default Hero;