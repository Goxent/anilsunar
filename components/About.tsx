import React from 'react';
import { Award, GraduationCap } from 'lucide-react';
import QUALIFICATIONS from '../src/content/qualifications.json';

const About: React.FC = () => {
  return (
    <section id="about" className="py-32 bg-surface-950 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-8 md:px-16 lg:px-24 relative z-10">
        <div className="reveal text-center mb-16 md:mb-24">
          <p className="text-accent-500 text-[10px] font-bold uppercase tracking-[0.4em] mb-4">
            About Me
          </p>
          <h2 className="text-4xl md:text-6xl font-serif font-bold text-white">
            My Story
          </h2>
          <div className="section-divider mx-auto mt-8"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-start reveal">
          {/* Bio Column */}
          <div className="flex flex-col gap-6 text-slate-400 text-lg leading-relaxed font-light reveal-delay-1">
            <p>
              I'm Anil Sunar — a Chartered Accountant from ICAN, Nepal, and an Audit Manager with hands-on experience leading complex audit engagements across diverse industries. I am also a <strong>Tigg Certified Professional</strong>, specializing in modern cloud accounting and workflow automation.
            </p>
            <p>
              Beyond the audit room, I'm a builder. I designed and developed the Goxent Intelligence Bot — a full-stack automation pipeline that combines my deep understanding of business processes with a passion for software engineering.
            </p>
            <p>
              I also go by Goxent — my creative identity. I write poetry and rap, exploring themes of life, finance, and the human experience. I share my creative work on my YouTube channel @goxent and on Instagram @goxent.
            </p>

            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-8 reveal reveal-delay-3 pt-8 border-t border-white/10">
              <div className="flex-1 min-w-[120px]">
                <div className="text-4xl font-serif font-bold text-white mb-2">5+</div>
                <div className="text-[10px] text-accent-500 uppercase tracking-[0.2em] font-bold">Years<br/>Experience</div>
              </div>
              <div className="flex-1 min-w-[120px]">
                <div className="text-4xl font-serif font-bold text-white mb-2">CA</div>
                <div className="text-[10px] text-accent-500 uppercase tracking-[0.2em] font-bold">Nepal<br/>Qualified</div>
              </div>
              <div className="flex-1 min-w-[120px]">
                <div className="text-4xl font-serif font-bold text-white mb-2">NEPSE</div>
                <div className="text-[10px] text-accent-500 uppercase tracking-[0.2em] font-bold">Market<br/>Analyst</div>
              </div>
              <div className="flex-1 min-w-[120px]">
                <div className="text-4xl font-serif font-bold text-white mb-2">10K+</div>
                <div className="text-[10px] text-accent-500 uppercase tracking-[0.2em] font-bold">LinkedIn<br/>Network</div>
              </div>
            </div>
          </div>

          {/* Stats & Qualifications Column */}
          <div className="flex flex-col gap-12 reveal-delay-2">
            {/* Qualifications Grid */}
            <div className="grid grid-cols-1 gap-6">
              {QUALIFICATIONS.map((qual, idx) => (
                <div key={idx} className="glass-card gradient-border p-8 group flex items-start gap-6">
                  <div className="shrink-0 p-4 rounded-2xl bg-white/5 text-accent-500/60 group-hover:text-accent-500 group-hover:bg-accent-500/10 transition-colors">
                    {qual.title.includes('Accountant') ? <Award size={32} /> : <GraduationCap size={32} />}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base md:text-lg tracking-wide mb-2 group-hover:text-accent-500 transition-colors">{qual.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed font-light mb-4">{qual.issuer}</p>
                    <span className="inline-block px-3 py-1 rounded-full bg-accent-500/10 text-accent-500 text-[10px] font-mono font-bold uppercase tracking-wider">{qual.year}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
