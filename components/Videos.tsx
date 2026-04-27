import React from 'react';
import { motion } from 'framer-motion';
import { Youtube, Calendar } from 'lucide-react';
import videosData from '../src/content/videos.json';

export default function Videos() {
  const videos = videosData;

  return (
    <section id="videos" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-surface-900/50 -z-10" />
      
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 md:mb-24"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-1 bg-accent-400 rounded-full" />
            <h2 className="text-sm font-bold tracking-[0.2em] text-accent-400 uppercase">Goxent Finance</h2>
          </div>
          <h3 className="text-4xl md:text-6xl font-black text-slate-100 tracking-tight">
            Latest <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-500">Videos</span>
          </h3>
          <p className="mt-6 text-slate-400 max-w-2xl text-lg">
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
              className="group relative rounded-2xl overflow-hidden bg-surface-950 border border-white/[0.06] hover:border-accent-400/20 transition-all duration-500"
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
              
              <div className="p-6">
                <div className="flex items-center gap-2 text-xs font-semibold text-accent-400 mb-3">
                  <Calendar size={14} />
                  {video.date}
                </div>
                <h4 className="text-lg font-bold text-slate-100 mb-2 group-hover:text-accent-300 transition-colors line-clamp-2">
                  {video.title}
                </h4>
                <p className="text-sm text-slate-500 line-clamp-2">
                  {video.description}
                </p>
                <a
                  href={`https://youtube.com/watch?v=${video.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-red-400 transition-colors"
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
