import React from 'react';
import postsData from '../src/content/posts.json';

const Posts: React.FC = () => {
  return (
    <section id="writing" className="py-32 bg-surface-900/30 relative">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="mb-20">
          <span className="text-accent-400 font-bold uppercase tracking-[0.3em] text-xs">Writing</span>
          <h2 className="text-5xl md:text-6xl font-serif mt-6 text-white">Articles & Thoughts</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {postsData.map((post) => (
            <div
              key={post.id}
              className="group p-8 rounded-2xl border border-white/5 bg-white/[0.03] transition-all duration-300 hover:border-accent-400/20 flex flex-col h-full"
            >
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs uppercase tracking-widest text-accent-400 border border-accent-400/15 px-3 py-1 rounded-full bg-accent-400/5">
                  {post.platform}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-accent-300 transition-colors">
                {post.title}
              </h3>
              
              <p className="text-slate-500 mb-8 text-sm leading-relaxed line-clamp-2">
                {post.excerpt}
              </p>

              <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between text-slate-500 group-hover:text-accent-400 transition-colors text-sm font-bold uppercase tracking-widest">
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
