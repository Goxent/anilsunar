import React from 'react';
import PROJECTS from '../src/content/projects.json';
import { ExternalLink } from 'lucide-react';

const Projects: React.FC = () => {
  return (
    <section id="projects" className="py-32 bg-surface-900/50 relative border-y border-white/5">
      <div className="w-full max-w-7xl mx-auto px-8 md:px-16 lg:px-24 relative z-10">
        <div className="text-center mb-20">
          <span className="text-accent-500 font-bold uppercase tracking-[0.3em] text-xs">Projects</span>
          <h2 className="text-5xl md:text-6xl font-serif mt-6 text-white">Things I've Built</h2>
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-accent-500/50 to-transparent mx-auto mt-8"></div>
        </div>

        {PROJECTS.length === 1 ? (
          <div className="flex justify-center w-full">
            <div className="w-full max-w-4xl group p-10 md:p-14 rounded-3xl border border-white/5 bg-surface-950/80 border-t-[3px] border-t-accent-500/60 transition-all duration-500 hover:bg-surface-950 hover:border-t-accent-500 shadow-2xl">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${PROJECTS[0].status === 'Live' ? 'bg-sage-400 animate-pulse shadow-[0_0_12px_rgba(74,222,128,0.6)]' : 'bg-accent-500/50'}`}></div>
                  <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">{PROJECTS[0].status}</span>
                </div>
              </div>

              <h3 className="text-4xl font-serif font-bold text-white mb-6 group-hover:text-accent-500 transition-colors">{PROJECTS[0].title}</h3>
              <p className="text-slate-400 mb-10 text-lg leading-relaxed font-light">{PROJECTS[0].description}</p>

              <div className="flex flex-wrap gap-3 mb-12">
                {PROJECTS[0].tags.map((tag) => (
                  <span key={tag} className="text-xs uppercase tracking-widest text-accent-500 border border-accent-500/20 px-4 py-2 rounded-full bg-accent-500/5">
                    {tag}
                  </span>
                ))}
              </div>

              <button
                disabled
                className="flex items-center gap-3 text-sm uppercase tracking-widest text-slate-500 cursor-not-allowed transition-colors font-bold"
              >
                View Project <ExternalLink size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {PROJECTS.map((project) => (
              <div
                key={project.id}
                className="group p-8 md:p-10 rounded-3xl border border-white/5 bg-surface-950/80 border-t-[3px] border-t-accent-500/60 transition-all duration-500 hover:bg-surface-950 hover:border-t-accent-500 shadow-2xl"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${project.status === 'Live' ? 'bg-sage-400 animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'bg-accent-500/50'}`}></div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{project.status}</span>
                  </div>
                </div>

                <h3 className="text-3xl font-serif font-bold text-white mb-4 group-hover:text-accent-500 transition-colors">{project.title}</h3>
                <p className="text-slate-400 mb-8 text-base leading-relaxed font-light">{project.description}</p>

                <div className="flex flex-wrap gap-2 mb-10">
                  {project.tags.map((tag) => (
                    <span key={tag} className="text-[10px] uppercase tracking-widest text-accent-500 border border-accent-500/20 px-3 py-1.5 rounded-full bg-accent-500/5">
                      {tag}
                    </span>
                  ))}
                </div>

                <button
                  disabled
                  className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-500 cursor-not-allowed transition-colors font-bold"
                >
                  View Project <ExternalLink size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Projects;
