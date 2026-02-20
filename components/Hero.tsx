import React, { useRef } from 'react';
import { ArrowDown } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Magnetic from './Magnetic';

const Hero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // Parallax Values connecting to Scroll
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const yText = useTransform(scrollYProgress, [0, 1], ["0%", "150%"]);
  const opacityText = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section
      ref={containerRef}
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-luxury-950"
    >
      {/* Premium Background Gradients with Parallax */}
      <motion.div
        style={{ y: yBg }}
        className="absolute inset-0 z-0 pointer-events-none"
      >
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gold-500/15 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-1/4 w-[800px] h-[800px] bg-purple-900/20 rounded-full blur-[150px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay"></div>
      </motion.div>

      <motion.div
        style={{ y: yText, opacity: opacityText }}
        className="relative z-10 text-center px-4 max-w-5xl mx-auto"
      >
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-gold-500 text-sm md:text-sm font-semibold tracking-[0.4em] uppercase mb-6"
        >
          Welcome to the Portfolio of
        </motion.h2>

        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-6xl md:text-9xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50 mb-6 leading-tight drop-shadow-[0_0_40px_rgba(255,255,255,0.2)]"
        >
          Goxent
        </motion.h1>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 0.8, ease: "anticipate" }}
          className="h-px w-32 bg-gradient-to-r from-transparent via-gold-500 to-transparent mx-auto mb-8"
        ></motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-slate-400 text-lg md:text-2xl max-w-2xl mx-auto font-light leading-relaxed"
        >
          Tech Enthusiast <span className="text-gold-500 mx-2">•</span> Auditor <span className="text-gold-500 mx-2">•</span> Poet <span className="text-gold-500 mx-2">•</span> UI/UX Designer <br />
          <span className="text-base md:text-xl mt-4 block text-slate-300">Crafting precision in numbers, rhythm in words, and beauty in pixels.</span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-14 flex flex-col md:flex-row gap-6 justify-center items-center"
        >
          <Magnetic>
            <a
              href="#about"
              className="group relative px-8 py-4 rounded-full text-sm uppercase tracking-widest border border-white/20 hover:border-gold-500/50 hover:text-gold-400 transition-all duration-500 w-56 flex items-center justify-center overflow-hidden bg-white/5 backdrop-blur-sm"
            >
              <span className="relative z-10">Explore</span>
              <div className="absolute inset-0 h-full w-full scale-0 rounded-full transition-all duration-500 group-hover:scale-100 group-hover:bg-white/5"></div>
            </a>
          </Magnetic>
          <Magnetic>
            <a
              href="#contact"
              className="relative px-8 py-4 rounded-full text-sm uppercase tracking-widest bg-gold-500 text-luxury-950 font-bold hover:bg-gold-400 transition-all duration-300 w-56 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_40px_rgba(245,158,11,0.6)] group"
            >
              Let's Connect
              <div className="absolute inset-0 rounded-full border border-gold-400 scale-105 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"></div>
            </a>
          </Magnetic>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 2, duration: 2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce"
      >
        <ArrowDown size={24} className="text-gold-500/50" />
      </motion.div>
    </section>
  );
};

export default Hero;