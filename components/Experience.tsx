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
      transition={{ duration: 0.7, delay: index * 0.2 }}
      className="relative pl-8 md:pl-0 md:grid md:grid-cols-5 gap-8"
    >
      {/* Date (Left on Desktop) */}
      <div className="md:col-span-1 md:text-right mb-2 md:mb-0">
        <span className="inline-block py-1 px-3 rounded-full bg-white/5 border border-white/10 text-xs text-gold-500 font-bold tracking-wider">
          {item.period}
        </span>
      </div>

      {/* Timeline Line/Dot */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-white/10 md:left-auto md:right-auto md:relative md:w-auto md:flex md:justify-center md:bg-transparent">
        <div className="absolute top-2 -left-1.5 md:static w-3 h-3 rounded-full bg-gold-500 shadow-[0_0_15px_rgba(251,191,36,0.5)] z-10"></div>
        <div className="hidden md:block absolute top-3 bottom-0 w-px bg-white/10 -z-0"></div>
      </div>

      {/* Content */}
      <div className="md:col-span-3 glass-card p-6 rounded-xl hover:bg-white/5 transition-colors duration-300 border border-white/5 hover:border-gold-500/30 group">
        <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2 group-hover:text-gold-400 transition-colors">
          <Briefcase size={16} className="text-slate-500 group-hover:text-gold-500" />
          {item.role}
        </h3>
        <h4 className="text-slate-400 text-sm mb-4 font-serif italic">{item.company}</h4>
        <p className="text-slate-300 mb-6 text-sm leading-relaxed">
          {item.description}
        </p>
        <div className="flex flex-wrap gap-2">
          {item.skills.map(skill => (
            <span key={skill} className="text-xs text-slate-400 bg-black/50 px-2 py-1 rounded border border-white/5 group-hover:border-gold-500/20 transition-colors">
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
    <section id="experience" ref={containerRef} className="py-24 bg-luxury-900 relative">
      {/* Background Elements */}
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-blue-900/10 rounded-full blur-[80px]"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold-500/5 rounded-full blur-[100px]"></div>

      <motion.div
        style={{ opacity }}
        className="max-w-5xl mx-auto px-6 relative z-10"
      >
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-gold-500 uppercase tracking-widest text-sm font-semibold">Career Path</span>
            <h2 className="text-3xl md:text-5xl font-serif mt-4 text-white">Professional Journey</h2>
          </motion.div>
        </div>

        <div className="space-y-12 md:space-y-16">
          {EXPERIENCE_DATA.map((item, index) => (
            <ExperienceCard key={item.id} item={item} index={index} />
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default Experience;