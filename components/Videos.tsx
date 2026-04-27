import React from 'react';
import { motion } from 'framer-motion';
import { Youtube, Calendar } from 'lucide-react';
import videosData from '../src/content/videos.json';

export default function Videos() {
  const videos = videosData;

  return (
    <section id="videos" className="py-32 relative overflow-hidden bg-surface-950">
      <div className="absolute inset-0 bg-gradient-to-b from-surface-900/50 to-transparent -z-10" />
      
      <div className="max-w-7xl mx-auto px-8 md:px-16 lg:px-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="text-accent-500 font-bold uppercase tracking-[0.3em] text-xs block mb-6">Goxent Finance</span>
          <h2 className="text-5xl md:text-6xl font-serif mt-6 text-white tracking-tight">
            Latest <span className="text-gradient-accent">Videos</span>
          </h2>
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-accent-500/50 to-transparent mx-auto mt-8 mb-6"></div>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg font-light">
            Deep dives, market analysis, and tutorials for Nepali retail investors.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {videos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative rounded-3xl overflow-hidden bg-surface-900/50 border border-white/5 hover:border-accent-500/30 transition-all duration-500 shadow-xl hover:shadow-accent-500/5"
            >
              <div className="aspect-video w-full relative">
                <iframe
                  src={`https://www.youtube.com/embed/${video.youtubeId}`}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>
              
              <div className="p-8">
                <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-accent-500 mb-4">
                  <Calendar size={14} />
                  {video.date}
                </div>
                <h4 className="text-xl font-serif font-bold text-white mb-3 group-hover:text-accent-500 transition-colors line-clamp-2">
                  {video.title}
                </h4>
                <p className="text-sm text-slate-400 line-clamp-2 font-light leading-relaxed">
                  {video.description}
                </p>
                <a
                  href={`https://youtube.com/watch?v=${video.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white hover:text-red-500 transition-colors"
                >
                  <Youtube size={16} /> Watch on YouTube
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
