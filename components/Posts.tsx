import React from 'react';
import postsData from '../src/content/posts.json';

const Posts: React.FC = () => {
  return (
    <section id="writing" className="py-32 bg-white relative">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="mb-20">
          <span className="text-gold-500 font-bold uppercase tracking-[0.3em] text-xs">Writing</span>
          <h2 className="text-5xl md:text-6xl font-serif mt-6 text-luxury-950">Articles & Thoughts</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {postsData.map((post) => (
            <div
              key={post.id}
              className="group p-8 rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:shadow-lg hover:border-gold-500/30 flex flex-col h-full"
            >
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs uppercase tracking-widest text-gold-500 border border-gold-500/20 px-3 py-1 rounded-full bg-gold-500/5">
                  {post.tag}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              <h3 className="text-2xl font-bold text-luxury-950 mb-4 group-hover:text-gold-500 transition-colors">
                {post.title}
              </h3>
              
              <p className="text-slate-600 mb-8 text-sm leading-relaxed line-clamp-2">
                {post.excerpt}
              </p>

              <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between text-slate-500 group-hover:text-gold-500 transition-colors text-sm font-bold uppercase tracking-widest">
                <a href={`#writing/${post.slug}`} className="flex items-center gap-2">
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
