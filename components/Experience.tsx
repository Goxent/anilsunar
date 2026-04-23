import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { EXPERIENCE_DATA } from '../constants';
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
        <span className="inline-block py-2 px-4 rounded-full bg-gold-500/10 border border-gold-500/20 text-xs text-gold-400 font-bold tracking-[0.2em] uppercase transition-all duration-500">
          {item.period}
        </span>
      </div>

      {/* Center UI - Timeline Dot */}
      <div className="absolute left-0 top-0 bottom-0 flex justify-center md:relative md:w-auto md:h-auto z-10">
        <div className="absolute top-3 -left-[5px] md:static w-4 h-4 rounded-full bg-luxury-900 border-2 border-gold-500 group-hover:scale-125 group-hover:bg-gold-500 transition-all duration-500"></div>
        {/* Vertical Line */}
        <div className="hidden md:block absolute top-8 bottom-[-48px] left-[7px] w-px bg-gradient-to-b from-gold-500/50 to-white/5 group-hover:from-gold-500 group-hover:to-gold-500/20 transition-all duration-500 -z-10"></div>
      </div>

      {/* Content Card */}
      <div className="md:w-3/4 bg-white/5 p-8 rounded-3xl border border-white/10 hover:border-gold-500/50 transition-all duration-500 hover:bg-white/10 hover:-translate-y-2 relative overflow-hidden">
        <h3 className="text-2xl font-serif font-bold text-white mb-2 flex items-center gap-3">
          <Briefcase size={20} className="text-gold-500/70 group-hover:text-gold-400 transition-colors" />
          {item.role}
        </h3>
        <h4 className="text-gold-500/80 text-sm mb-5 font-medium tracking-wide uppercase">{item.company}</h4>

        <p className="text-slate-300 mb-8 text-base leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity duration-500">
          {item.description}
        </p>

        <div className="flex flex-wrap gap-3">
          {item.skills.map(skill => (
            <span key={skill} className="text-xs font-mono text-slate-400 bg-luxury-950/80 px-3 py-1.5 rounded-lg border border-white/5 group-hover:border-gold-500/30 group-hover:text-white transition-all duration-300">
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
    <section id="experience" ref={containerRef} className="py-32 bg-luxury-950 relative">
      <div className="absolute top-1/4 left-[-10%] w-[500px] h-[500px] bg-purple-900/5 rounded-full blur-[20px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-[-10%] w-[600px] h-[600px] bg-gold-500/5 rounded-full blur-[20px] pointer-events-none"></div>

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
            <span className="text-gold-500 font-bold uppercase tracking-[0.3em] text-xs">Career Path</span>
            <h2 className="text-5xl md:text-7xl font-serif mt-6 text-white tracking-tight">Professional Journey</h2>
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-gold-500 to-transparent mx-auto mt-8 opacity-50"></div>
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