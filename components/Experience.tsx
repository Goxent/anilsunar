import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import EXPERIENCE_DATA from '../src/content/experience.json';
import { Briefcase } from 'lucide-react';

const ExperienceCard: React.FC<{ item: typeof EXPERIENCE_DATA[0]; index: number }> = ({ item, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay: index * 0.2, type: 'spring', stiffness: 50 }}
      className="relative pl-10 md:pl-0 md:flex items-center gap-12 group"
    >
      {/* Date */}
      <div className="md:w-1/4 md:text-right mb-4 md:mb-0 shrink-0">
        <span className="inline-block py-2 px-4 rounded-full bg-accent-400/[0.07] border border-accent-400/15 text-xs text-accent-400 font-bold tracking-[0.2em] uppercase transition-all duration-500">
          {item.period}
        </span>
      </div>

      {/* Timeline Dot */}
      <div className="absolute left-0 top-0 bottom-0 flex justify-center md:relative md:w-auto md:h-auto z-10">
        <div className="absolute top-3 -left-[5px] md:static w-3 h-3 rounded-full bg-surface-950 border-2 border-accent-400/60 group-hover:scale-125 group-hover:bg-accent-400 transition-all duration-500"></div>
        <div className="hidden md:block absolute top-8 bottom-[-48px] left-[5px] w-px bg-gradient-to-b from-accent-400/30 to-white/5 group-hover:from-accent-400/60 transition-all duration-500 -z-10"></div>
      </div>

      {/* Content Card */}
      <div className="md:w-3/4 bg-white/[0.03] p-8 rounded-2xl border border-white/[0.06] hover:border-accent-400/20 transition-all duration-500 hover:bg-white/[0.05] relative overflow-hidden">
        <h3 className="text-2xl font-serif font-bold text-white mb-2 flex items-center gap-3">
          <Briefcase size={18} className="text-accent-400/50 group-hover:text-accent-400 transition-colors" />
          {item.role}
        </h3>
        <h4 className="text-accent-400/70 text-sm mb-5 font-medium tracking-wide uppercase">{item.company}</h4>

        <p className="text-slate-400 mb-8 text-base leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity duration-500">
          {item.description}
        </p>

        <div className="flex flex-wrap gap-3">
          {item.skills.map(skill => (
            <span key={skill} className="text-xs font-mono text-slate-500 bg-surface-950/80 px-3 py-1.5 rounded-lg border border-white/5 group-hover:border-accent-400/15 group-hover:text-slate-300 transition-all duration-300">
              {skill}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const Experience: React.FC = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.9, 1], [0, 1, 1, 0]);

  return (
    <section id="experience" ref={containerRef} className="py-32 bg-surface-950 relative">
      {/* Subtle warm background glow — no purple */}
      <div className="absolute bottom-1/4 right-[-10%] w-[600px] h-[600px] bg-accent-500/[0.03] rounded-full blur-[120px] pointer-events-none"></div>

      <motion.div
        style={{ opacity }}
        className="max-w-6xl mx-auto px-6 relative z-10"
      >
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, type: 'spring' }}
          >
            <span className="text-accent-400 font-bold uppercase tracking-[0.3em] text-xs">Career Path</span>
            <h2 className="text-5xl md:text-7xl font-serif mt-6 text-white tracking-tight">Professional Journey</h2>
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-accent-400/50 to-transparent mx-auto mt-8"></div>
          </motion.div>
        </div>

        <div className="space-y-16 md:space-y-24">
          {EXPERIENCE_DATA.map((item, index) => (
            <ExperienceCard key={item.id} item={item} index={index} />
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default Experience;