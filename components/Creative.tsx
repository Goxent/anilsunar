import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { CREATIVE_WORKS } from '../constants';
import { Mic2, Feather, X, Play, Pause } from 'lucide-react';
import { CreativeWork } from '../types';

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
    <section id="creative" className="py-24 bg-luxury-950 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>

      <div ref={ref} className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <span className="text-purple-400 uppercase tracking-widest text-sm font-semibold">Passion</span>
            <h2 className="text-5xl md:text-7xl font-serif mt-4 text-white">
              Poetry & <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">Rap</span>
            </h2>
          </motion.div>
          <motion.p
            className="text-slate-400 max-w-sm text-right md:text-left text-lg font-light"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Exploring the cadence of life through verses and flow. Where simple words become complex emotions.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {CREATIVE_WORKS.map((work, idx) => (
            <motion.div
              key={work.id}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: idx * 0.2 }}
              className="group glass-card p-8 rounded-3xl border border-white/5 hover:border-purple-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_10px_40px_-10px_rgba(168,85,247,0.2)] flex flex-col justify-between h-full"
            >
              <div>
                <div className="mb-6 flex justify-between items-start">
                  <div className={`p-4 rounded-2xl ${work.type === 'Rap' ? 'bg-purple-500/20 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'bg-gold-500/20 text-gold-300 shadow-[0_0_15px_rgba(251,191,36,0.2)]'}`}>
                    {work.type === 'Rap' ? <Mic2 size={24} /> : <Feather size={24} />}
                  </div>
                  <span className="text-xs text-slate-600 font-mono tracking-widest">0{idx + 1}</span>
                </div>

                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-purple-300 transition-colors font-serif">{work.title}</h3>

                <div className="relative pl-4 border-l-2 border-slate-800 mb-6 group-hover:border-purple-500/50 transition-colors duration-500">
                  <p className="text-slate-400 italic text-sm leading-relaxed whitespace-pre-line line-clamp-3">
                    "{work.excerpt}"
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleReadMore(work)}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs uppercase tracking-widest text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2 group-hover:bg-purple-600 group-hover:text-white"
              >
                Read Piece <span className="text-lg leading-none">&rarr;</span>
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Full Content Modal */}
      <AnimatePresence>
        {selectedWork && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
              onClick={() => setSelectedWork(null)}
            ></div>
            <motion.div
              className="relative bg-luxury-900 border border-white/10 rounded-3xl p-8 md:p-12 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <button
                onClick={() => setSelectedWork(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <div className="mb-8 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${selectedWork.type === 'Rap' ? 'bg-purple-500/20 text-purple-300' : 'bg-gold-500/20 text-gold-300'}`}>
                  {selectedWork.type === 'Rap' ? <Mic2 size={24} /> : <Feather size={24} />}
                </div>
                <span className="text-sm uppercase tracking-widest text-slate-500 font-semibold">{selectedWork.type}</span>
              </div>

              <h3 className="text-4xl md:text-5xl font-serif text-white mb-8">{selectedWork.title}</h3>

              <div className="relative bg-luxury-950/50 p-6 md:p-8 rounded-2xl border border-white/5">
                <div className="absolute left-0 top-10 bottom-10 w-1 bg-gradient-to-b from-purple-500 via-pink-500 to-gold-500 rounded-full opacity-70"></div>
                <div className="pl-6 text-slate-300 leading-relaxed whitespace-pre-line font-serif text-lg md:text-xl">
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