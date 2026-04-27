import React from 'react';
import postsData from '../src/content/posts.json';

const Posts: React.FC = () => {
  return (
    <section id="writing" className="py-32 bg-surface-900/30 relative border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <span className="text-accent-500 font-bold uppercase tracking-[0.3em] text-xs">Writing</span>
          <h2 className="text-5xl md:text-6xl font-serif mt-6 text-white">Articles & Thoughts</h2>
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-accent-500/50 to-transparent mx-auto mt-8"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {postsData.map((post) => (
            <div
              key={post.id}
              className="group p-8 md:p-10 rounded-3xl border border-white/5 bg-surface-950/80 transition-all duration-500 hover:border-accent-500/30 hover:shadow-xl hover:shadow-accent-500/5 flex flex-col h-full"
            >
              <div className="flex justify-between items-center mb-8">
                <span className="text-[10px] uppercase tracking-widest font-bold text-accent-500 border border-accent-500/20 px-3 py-1.5 rounded-full bg-accent-500/5">
                  {post.platform}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-mono font-bold">
                  {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              <h3 className="text-2xl font-serif font-bold text-white mb-4 group-hover:text-accent-500 transition-colors">
                {post.title}
              </h3>
              
              <p className="text-slate-400 mb-8 text-sm leading-relaxed font-light">
                {post.excerpt}
              </p>

              <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between text-slate-500 group-hover:text-accent-500 transition-colors text-xs font-bold uppercase tracking-widest">
                <a href={post.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  Read more <span>&rarr;</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Posts;
