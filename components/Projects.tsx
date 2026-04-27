import React from 'react';
import PROJECTS from '../src/content/projects.json';
import { ExternalLink } from 'lucide-react';

const Projects: React.FC = () => {
  return (
    <section id="projects" className="py-32 bg-surface-900/30 relative">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="mb-20">
          <span className="text-accent-400 font-bold uppercase tracking-[0.3em] text-xs">Projects</span>
          <h2 className="text-5xl md:text-6xl font-serif mt-6 text-white">Things I've Built</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {PROJECTS.map((project) => (
            <div
              key={project.id}
              className="group p-8 rounded-2xl border border-white/5 bg-surface-950/50 border-l-[3px] border-l-accent-400/60 transition-all duration-500 hover:bg-surface-950 hover:border-l-accent-400"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${project.status === 'Live' ? 'bg-sage-400 animate-pulse' : 'bg-accent-400/50'}`}></div>
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{project.status}</span>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-accent-300 transition-colors">{project.title}</h3>
              <p className="text-slate-400 mb-8 text-sm leading-relaxed font-light">{project.description}</p>

              <div className="flex flex-wrap gap-2 mb-8">
                {project.tags.map((tag) => (
                  <span key={tag} className="text-[10px] uppercase tracking-widest text-accent-400 border border-accent-400/15 px-2 py-1 rounded-md">
                    {tag}
                  </span>
                ))}
              </div>

              <button
                disabled
                className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-600 cursor-not-allowed transition-colors"
              >
                View Project <ExternalLink size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
