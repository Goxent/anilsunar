import React, { useState } from 'react';
import { Play, Youtube, Instagram } from 'lucide-react';
import coursesData from '../src/content/courses.json';

const CATEGORIES = ['All', ...Array.from(new Set(coursesData.map(c => c.category)))];

const Courses: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All'
    ? coursesData
    : coursesData.filter(c => c.category === activeCategory);

  return (
    <section id="courses" className="py-32 bg-surface-950 relative">
      <div className="max-w-7xl mx-auto px-8 md:px-16 lg:px-24 relative z-10">
        <div className="text-center mb-16">
          <span className="text-accent-400 font-bold uppercase tracking-[0.3em] text-xs">Content</span>
          <h2 className="text-5xl md:text-6xl font-serif mt-6 text-white mb-4">Videos & Courses</h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto font-light">
            Explore my content on NEPSE trading, finance, technology, and creative arts.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-16">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full text-xs uppercase tracking-widest font-bold transition-all duration-300 border ${
                activeCategory === cat
                  ? 'bg-accent-400 text-surface-950 border-accent-400'
                  : 'bg-transparent text-slate-400 border-white/10 hover:border-accent-400/30 hover:text-accent-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((course) => (
            <div
              key={course.id}
              className="group rounded-2xl border border-white/5 bg-white/[0.03] overflow-hidden hover:border-accent-400/15 transition-all duration-500"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-surface-900 flex items-center justify-center overflow-hidden">
                {course.youtubeId ? (
                  <img
                    src={`https://img.youtube.com/vi/${course.youtubeId}/hqdefault.jpg`}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-slate-600">
                    <Play size={40} />
                    <span className="text-xs tracking-widest uppercase">Coming Soon</span>
                  </div>
                )}

                {course.youtubeId && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-14 h-14 rounded-full bg-accent-400 flex items-center justify-center">
                      <Play size={24} className="text-surface-950 ml-1" fill="currentColor" />
                    </div>
                  </div>
                )}

                {/* Platform badge */}
                <div className="absolute top-3 right-3">
                  {course.platform === 'youtube' ? (
                    <div className="p-2 rounded-lg bg-red-600/80 text-white">
                      <Youtube size={16} />
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-pink-600/80 text-white">
                      <Instagram size={16} />
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] uppercase tracking-widest text-accent-400 border border-accent-400/15 px-2 py-0.5 rounded-md bg-accent-400/5">
                    {course.category}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-accent-300 transition-colors line-clamp-2">
                  {course.title}
                </h3>
                <p className="text-slate-500 text-sm line-clamp-2">{course.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <a
            href="https://www.youtube.com/@goxent"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full border border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white transition-all duration-500 text-sm uppercase tracking-widest font-bold"
          >
            <Youtube size={20} /> Subscribe on YouTube
          </a>
        </div>
      </div>
    </section>
  );
};

export default Courses;
