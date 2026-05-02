import React from 'react';
import PROJECTS from '../src/content/projects.json';
import { ExternalLink, Github, Lock } from 'lucide-react';

const Projects: React.FC = () => {
  return (
    <section id="projects" className="py-32 bg-surface-900/50 relative border-y border-white/5">
      <div className="w-full max-w-7xl mx-auto px-8 md:px-16 lg:px-24 relative z-10">
        <div className="reveal text-center mb-16 md:mb-24">
          <p className="text-accent-500 text-[10px] font-bold uppercase tracking-[0.4em] mb-4">
            Projects
          </p>
          <h2 className="text-4xl md:text-6xl font-serif font-bold text-white">
            Things I've Built
          </h2>
          <div className="section-divider mx-auto mt-8"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {PROJECTS.map((project, index) => (
            <div
              key={project.id}
              className={`group p-8 md:p-10 glass-card gradient-border flex flex-col justify-between reveal reveal-delay-${(index % 4) + 1} hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] transition-all duration-500`}
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${project.status === 'Live' ? 'bg-sage-400 animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'bg-accent-500/50'}`}></div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{project.status}</span>
                  </div>
                </div>

                <h3 className="text-2xl font-serif font-bold text-white mb-4 group-hover:text-accent-500 transition-colors leading-tight">{project.title}</h3>
                <p className="text-slate-400 mb-8 text-sm leading-relaxed font-light">{project.description}</p>

                <div className="flex flex-wrap gap-2 mb-10">
                  {project.tags.map((tag) => (
                    <span key={tag} className="text-[9px] uppercase tracking-widest text-accent-500 border border-accent-500/20 px-3 py-1 rounded bg-accent-500/5 font-bold">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {project.link ? (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white hover:text-accent-500 transition-all duration-300 font-bold group/link"
                >
                  {project.link.includes('github.com') ? (
                    <><Github size={16} /> View Source</>
                  ) : (
                    <><ExternalLink size={16} /> Live Demo</>
                  )}
                  <span className="translate-x-0 group-hover/link:translate-x-2 transition-transform duration-300">&rarr;</span>
                </a>
              ) : (
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-600 font-bold">
                  <Lock size={14} /> Private Project
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
