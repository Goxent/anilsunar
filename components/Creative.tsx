import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useInView, useMotionValue, useTransform } from 'framer-motion';
import { CREATIVE_WORKS } from '../constants';
import { Mic2, Feather, X } from 'lucide-react';
import { CreativeWork } from '../types';

// Custom 3D Tilt Card Component
const TiltCard = ({ children, onClick, delay }: { children: React.ReactNode, onClick: () => void, delay: number }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  function handleMouse(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - rect.left - rect.width / 2);
    y.set(event.clientY - rect.top - rect.height / 2);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, delay, type: "spring" }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouse}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className="group relative h-full glass-card p-8 rounded-3xl border border-white/5 hover:border-purple-500/50 transition-colors duration-500 cursor-pointer overflow-hidden flex flex-col justify-between shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_60px_-15px_rgba(168,85,247,0.3)] bg-gradient-to-br from-white/5 to-transparent"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-luxury-950 via-luxury-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none z-0"></div>
      <div className="relative z-10 h-full flex flex-col justify-between" style={{ transform: "translateZ(30px)" }}>
        {children}
      </div>
    </motion.div>
  );
};

const Creative: React.FC = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [selectedWork, setSelectedWork] = useState<CreativeWork | null>(null);

  const handleReadMore = (work: CreativeWork) => {
    if (work.link) {
      window.open(work.link, '_blank', 'noopener,noreferrer');
    } else {
      setSelectedWork(work);
    }
  };

  return (
    <section id="creative" className="py-32 bg-luxury-950 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] pointer-events-none mix-blend-overlay"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-purple-900/15 rounded-full blur-[150px] pointer-events-none animate-pulse-slow"></div>

      <div ref={ref} className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, type: "spring" }}
          >
            <span className="text-purple-400 uppercase tracking-[0.3em] text-xs font-bold shadow-purple-500/50 drop-shadow-lg">Passion</span>
            <h2 className="text-6xl md:text-8xl font-serif mt-4 text-white hover:text-purple-300 transition-colors duration-500 cursor-default">
              Poetry & <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-gold-400 filter drop-shadow-[0_0_20px_rgba(216,180,254,0.3)]">Rap</span>
            </h2>
          </motion.div>
          <motion.p
            className="text-slate-400 max-w-md text-right md:text-left text-xl font-light leading-relaxed"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 1, delay: 0.4 }}
          >
            Exploring the cadence of life through verses and flow. Where simple words become complex emotions.
          </motion.p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[350px]">
          {CREATIVE_WORKS.map((work, idx) => {
            // Logic to create staggered bento sizes
            const colSpan = idx === 0 ? 'md:col-span-8' : idx === 1 ? 'md:col-span-4' : idx === 2 ? 'md:col-span-5' : 'md:col-span-7';

            return (
              <div key={work.id} className={colSpan}>
                <TiltCard delay={idx * 0.15} onClick={() => handleReadMore(work)}>
                  <div>
                    <div className="mb-8 flex justify-between items-start">
                      <div className={`p-4 rounded-2xl backdrop-blur-md border ${work.type === 'Rap' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30 shadow-[0_0_25px_rgba(168,85,247,0.4)]' : 'bg-gold-500/20 text-gold-300 border-gold-500/30 shadow-[0_0_25px_rgba(251,191,36,0.3)]'}`}>
                        {work.type === 'Rap' ? <Mic2 size={28} /> : <Feather size={28} />}
                      </div>
                      <span className="text-xs text-slate-500 font-mono tracking-widest border border-white/10 px-3 py-1 rounded-full bg-black/40">0{idx + 1}</span>
                    </div>

                    <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-200 group-hover:to-pink-200 transition-all font-serif leading-tight">
                      {work.title}
                    </h3>

                    <div className="relative pl-5 border-l-2 border-slate-700/50 mb-6 group-hover:border-purple-500/70 transition-colors duration-500">
                      <p className="text-slate-300/80 italic text-base leading-relaxed whitespace-pre-line line-clamp-3 font-light text-shadow-sm">
                        "{work.excerpt}"
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between text-slate-400 group-hover:text-white transition-colors">
                    <span className="text-xs uppercase tracking-[0.2em] font-medium">{work.type}</span>
                    <span className="text-xl rotate-0 group-hover:-rotate-45 transition-transform duration-500">&rarr;</span>
                  </div>
                </TiltCard>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full Content Modal / Drawer overlay */}
      <AnimatePresence>
        {selectedWork && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-luxury-950/80 backdrop-blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedWork(null)}
            ></motion.div>

            <motion.div
              className="relative bg-luxury-900 border border-white/10 rounded-[40px] p-8 md:p-14 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-[0_0_100px_rgba(0,0,0,0.8)]"
              initial={{ scale: 0.95, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 40 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              {/* Decorative Modal Gradients */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

              <button
                onClick={() => setSelectedWork(null)}
                className="absolute top-8 right-8 p-3 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/10"
              >
                <X size={24} />
              </button>

              <div className="mb-10 flex items-center gap-5">
                <div className={`p-4 rounded-2xl backdrop-blur-md border ${selectedWork.type === 'Rap' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-gold-500/20 text-gold-300 border-gold-500/30'}`}>
                  {selectedWork.type === 'Rap' ? <Mic2 size={28} /> : <Feather size={28} />}
                </div>
                <span className="text-sm uppercase tracking-[0.2em] text-slate-400 font-bold">{selectedWork.type}</span>
              </div>

              <h3 className="text-5xl md:text-6xl font-serif text-white mb-10 leading-tight">{selectedWork.title}</h3>

              <div className="relative bg-black/30 p-8 md:p-12 rounded-[32px] border border-white/5">
                <div className="absolute left-6 top-12 bottom-12 w-1 bg-gradient-to-b from-purple-500 via-pink-500 to-gold-500 rounded-full opacity-50"></div>
                <div className="pl-8 text-slate-300 leading-loose whitespace-pre-line font-serif text-xl md:text-2xl text-shadow-sm">
                  {selectedWork.content || selectedWork.excerpt}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Creative;