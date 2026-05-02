import React, { useState } from 'react';
import { Play, Youtube, Instagram, X } from 'lucide-react';
import coursesData from '../src/content/courses.json';

const FIXED_CATEGORIES = ['All', 'NEPSE Analysis', 'Tutorials', 'Creative'];

const VideoCard: React.FC<{ course: typeof coursesData[0] }> = ({ course }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div
      className="group rounded-2xl border border-white/5 bg-white/[0.03] overflow-hidden hover:border-accent-400/15 transition-all duration-500 shadow-xl"
    >
      {/* Media Container */}
      <div className="relative aspect-video bg-surface-900 flex items-center justify-center overflow-hidden">
        {isPlaying && course.youtubeId ? (
          <iframe
            src={`https://www.youtube.com/embed/${course.youtubeId}?autoplay=1`}
            title={course.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        ) : (
          <div 
            className="w-full h-full cursor-pointer relative group/thumb"
            onClick={() => course.youtubeId && setIsPlaying(true)}
          >
            {course.youtubeId ? (
              <>
                <img
                  src={`https://img.youtube.com/vi/${course.youtubeId}/hqdefault.jpg`}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-300">
                  <div className="w-16 h-16 rounded-full bg-accent-500 flex items-center justify-center shadow-2xl scale-90 group-hover/thumb:scale-100 transition-transform duration-300">
                    <Play size={28} className="text-surface-950 ml-1" fill="currentColor" />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-600">
                <Play size={40} />
                <span className="text-[10px] tracking-widest uppercase font-bold">Coming Soon</span>
              </div>
            )}

            {/* Platform badge */}
            <div className="absolute top-3 right-3 z-10">
              {course.platform === 'youtube' ? (
                <div className="p-2 rounded-lg bg-red-600/90 text-white backdrop-blur-sm">
                  <Youtube size={14} />
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-pink-600/90 text-white backdrop-blur-sm">
                  <Instagram size={14} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[9px] uppercase tracking-[0.2em] text-accent-500 border border-accent-500/20 px-3 py-1 rounded-full bg-accent-500/5 font-bold">
            {course.category}
          </span>
        </div>
        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-accent-300 transition-colors line-clamp-2 font-serif">
          {course.title}
        </h3>
        <p className="text-slate-400 text-sm line-clamp-2 font-light leading-relaxed">{course.description}</p>
      </div>
    </div>
  );
};

const Courses: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All'
    ? coursesData
    : coursesData.filter(c => c.category === activeCategory);

  return (
    <section id="courses" className="py-32 bg-surface-950 relative border-t border-white/5">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-accent-500/[0.02] rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-8 md:px-16 lg:px-24 relative z-10">
        <div className="reveal text-center mb-20">
          <p className="text-accent-500 text-[10px] font-bold uppercase tracking-[0.4em] mb-4">
            Mastery & Creation
          </p>
          <h2 className="text-5xl md:text-6xl font-serif font-bold text-white">
            Videos & Courses
          </h2>
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-accent-500/50 to-transparent mx-auto mt-8 mb-8"></div>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto font-light">
            Deep dives into NEPSE analysis, finance tutorials, and my creative musical journey as Goxent.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-20">
          {FIXED_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-8 py-3 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold transition-all duration-500 border ${
                activeCategory === cat
                  ? 'bg-accent-500 text-surface-950 border-accent-500 shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                  : 'glass-card border-white/5 text-slate-500 hover:border-accent-500/40 hover:text-accent-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Video Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filtered.map((course) => (
              <VideoCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl">
            <p className="text-slate-500 uppercase tracking-widest text-xs">New content coming soon to this category</p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-24 text-center">
          <a
            href="https://www.youtube.com/@goxent"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-4 px-10 py-5 rounded-full bg-red-600/10 border border-red-600/20 text-red-500 hover:bg-red-600 hover:text-white transition-all duration-500 text-xs uppercase tracking-[0.2em] font-bold group shadow-lg"
          >
            <Youtube size={20} className="group-hover:scale-110 transition-transform" /> 
            Join the Goxent Community
          </a>
        </div>
      </div>
    </section>
  );
};

export default Courses;
