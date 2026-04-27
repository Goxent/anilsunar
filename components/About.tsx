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
          <div className="section-divider mt-8"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-start reveal">
          {/* Bio Column */}
          <div className="flex flex-col gap-6 text-slate-400 text-lg leading-relaxed font-light reveal-delay-1">
            
            <div className="flex flex-col gap-6 text-slate-400 text-lg leading-relaxed font-light">
              <p>
                I'm Anil Sunar — a Chartered Accountant from ICAN, Nepal, and an Audit Manager with hands-on experience leading complex audit engagements across diverse industries. My academic foundation is a Bachelor of Business Studies (BBS), which shaped my analytical approach to finance and business.
              </p>
              <p>
                Beyond the audit room, I'm a builder. I designed and developed a web application that automates operational workflows — combining my deep understanding of business processes with a passion for technology and software.
              </p>
              <p>
                I also go by Goxent — my creative identity. I write poetry and rap, exploring themes of life, finance, and the human experience. I share my creative work on my YouTube channel @goxent and on Instagram @goxent.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-6 reveal reveal-delay-3">
              <div className="glass-card gradient-border p-6 text-center">
                <div className="text-3xl font-bold text-accent-500 mb-2">5+</div>
                <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Years Experience</div>
              </div>
              <div className="glass-card gradient-border p-6 text-center">
                <div className="text-3xl font-bold text-accent-500 mb-2">CA</div>
                <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Nepal Qualified</div>
              </div>
              <div className="glass-card gradient-border p-6 text-center">
                <div className="text-3xl font-bold text-accent-500 mb-2">NEPSE</div>
                <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Analyst</div>
              </div>
              <div className="glass-card gradient-border p-6 text-center">
                <div className="text-3xl font-bold text-accent-500 mb-2">10K+</div>
                <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">LinkedIn Network</div>
              </div>
            </div>
          </div>

          {/* Stats & Qualifications Column */}
          <div className="flex flex-col gap-12 reveal-delay-2">
            {/* Qualifications Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {QUALIFICATIONS.map((qual, idx) => (
                <div key={idx} className="glass-card gradient-border p-8 group">
                  <div className="mb-6 text-accent-500/40 group-hover:text-accent-500 transition-colors">
                    {qual.credential.includes('Accountant') ? <Award size={28} /> : <GraduationCap size={28} />}
                  </div>
                  <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3 group-hover:text-accent-500 transition-colors">{qual.credential}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed font-light">{qual.body}</p>
                  <p className="text-accent-500/60 text-[10px] mt-4 font-mono font-bold">{qual.year}</p>
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
