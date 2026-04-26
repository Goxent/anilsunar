import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import CREATIVE_WORKS from '../src/content/creative.json';
import { Mic2, Feather, Youtube, Instagram, Play, X } from 'lucide-react';
import { CreativeWork } from '../types';

const Creative: React.FC = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [selectedWork, setSelectedWork] = useState<CreativeWork | null>(null);

  const handleReadMore = (work: any) => {
    if (work.type === 'YouTube' || work.link) {
      window.open(work.link || work.content, '_blank', 'noopener,noreferrer');
    } else {
      setSelectedWork(work);
    }
  };

  const mainWorks = CREATIVE_WORKS.filter(w => w.type !== 'YouTube');

  return (
    <section id="creative" className="py-32 bg-luxury-950 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <span className="text-purple-400 font-bold uppercase tracking-[0.3em] text-xs">Creative Works</span>
          <h2 className="text-5xl md:text-7xl font-serif mt-6 text-white mb-4">Poetry · Rap · YouTube</h2>
        </div>

        {/* Goxent Banner */}
        <div className="mb-20 p-8 md:p-12 rounded-[40px] bg-luxury-900/50 border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/5 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="relative z-10 flex flex-col items-center text-center">
            <h3 className="text-6xl md:text-8xl font-serif font-bold text-gold-500 mb-4 tracking-tighter">Goxent</h3>
            <p className="text-xl md:text-2xl text-slate-300 font-light mb-8 max-w-2xl">
              My creative identity — poetry, rap & video content. <br />
              <span className="text-lg text-slate-400 mt-4 block">I explore the intersection of finance, life, and creativity through words and video.</span>
            </p>
            
            <div className="flex flex-wrap gap-6 justify-center">
              <a 
                href="https://www.youtube.com/@goxent" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-8 py-4 rounded-full bg-red-600/10 text-red-500 border border-red-500/20 hover:bg-red-600 hover:text-white transition-all duration-500 font-bold tracking-wider uppercase text-sm"
              >
                <Youtube size={20} /> YouTube @goxent
              </a>
              <a 
                href="https://www.instagram.com/goxent" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-8 py-4 rounded-full bg-pink-600/10 text-pink-500 border border-pink-500/20 hover:bg-pink-600 hover:text-white transition-all duration-500 font-bold tracking-wider uppercase text-sm"
              >
                <Instagram size={20} /> Instagram @goxent
              </a>
            </div>
          </div>
        </div>

        {/* Grid of works */}
        <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {mainWorks.map((work, idx) => (
            <div 
              key={work.id} 
              onClick={() => handleReadMore(work)}
              className="group relative p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-gold-500/30 transition-all duration-500 cursor-pointer flex flex-col justify-between h-[300px]"
            >
              <div>
                <div className="mb-6 flex justify-between items-start">
                  <div className={`p-3 rounded-xl border ${work.type === 'Rap' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-gold-500/10 text-gold-400 border-gold-500/20'}`}>
                    {work.type === 'Rap' ? <Mic2 size={24} /> : <Feather size={24} />}
                  </div>
                  <span className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full ${work.type === 'Rap' ? 'text-purple-400 bg-purple-500/10' : 'text-gold-400 bg-gold-500/10'}`}>
                    {work.type}
                  </span>
                </div>
                <h3 className="text-2xl font-serif text-white mb-4 group-hover:text-gold-400 transition-colors">{work.title}</h3>
                <p className="text-slate-400 text-sm italic line-clamp-3">"{work.excerpt}"</p>
              </div>
              <div className="pt-6 border-t border-white/5 flex items-center justify-between text-slate-500 group-hover:text-white transition-colors text-xs uppercase tracking-widest">
                <span>View Piece</span>
                <span>&rarr;</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center text-slate-500 text-sm font-light">
          New poems and verses posted regularly on <a href="https://www.instagram.com/goxent" target="_blank" className="text-gold-500/80 hover:text-gold-400 underline decoration-gold-500/20">Instagram @goxent</a> and <a href="https://www.youtube.com/@goxent" target="_blank" className="text-gold-500/80 hover:text-gold-400 underline decoration-gold-500/20">YouTube</a>.
        </div>
      </div>

      {/* Full Content Modal */}
      <AnimatePresence>
        {selectedWork && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-luxury-950/90" onClick={() => setSelectedWork(null)}></div>
            <motion.div
              className="relative bg-luxury-900 border border-white/10 rounded-3xl p-8 md:p-12 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <button onClick={() => setSelectedWork(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X /></button>
              <h3 className="text-4xl font-serif text-white mb-8">{selectedWork.title}</h3>
              <div className="text-slate-300 text-xl font-serif leading-relaxed whitespace-pre-line border-l-2 border-gold-500/50 pl-8">
                {selectedWork.content || selectedWork.excerpt}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Creative;