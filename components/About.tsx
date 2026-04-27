import React from 'react';
import { Award, GraduationCap } from 'lucide-react';
import QUALIFICATIONS from '../src/content/qualifications.json';

const About: React.FC = () => {
  return (
    <section id="about" className="py-32 bg-surface-950 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          {/* Bio Column */}
          <div className="fade-in">
            <span className="text-accent-400 font-bold uppercase tracking-[0.3em] text-xs">About Me</span>
            <h2 className="text-5xl md:text-6xl font-serif mt-6 text-white mb-10">My Story</h2>
            
            <div className="space-y-6 text-slate-400 text-lg leading-relaxed font-light">
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
          </div>

          {/* Stats & Qualifications Column */}
          <div className="space-y-12 fade-in" style={{ animationDelay: '0.2s' }}>
            {/* Stats Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-8 border-y border-white/5">
              <div className="text-center">
                <span className="block text-3xl font-serif text-white font-bold">3+</span>
                <span className="text-xs uppercase tracking-widest text-slate-500 mt-1 block">Years Auditing</span>
              </div>
              <div className="text-center">
                <span className="block text-3xl font-serif text-white font-bold">1</span>
                <span className="text-xs uppercase tracking-widest text-slate-500 mt-1 block">Automation System</span>
              </div>
              <div className="text-center">
                <span className="block text-3xl font-serif text-white font-bold">2</span>
                <span className="text-xs uppercase tracking-widest text-slate-500 mt-1 block">Creative Brands</span>
              </div>
            </div>

            {/* Qualifications Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {QUALIFICATIONS.map((qual, idx) => (
                <div key={idx} className="p-6 rounded-2xl border border-white/5 bg-white/[0.03] hover:border-accent-400/20 transition-all duration-500 group">
                  <div className="mb-4 text-accent-400/40 group-hover:text-accent-400 transition-colors">
                    {qual.credential.includes('Accountant') ? <Award size={24} /> : <GraduationCap size={24} />}
                  </div>
                  <h3 className="text-accent-300 font-bold text-sm uppercase tracking-wide mb-2">{qual.credential}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{qual.body}</p>
                  <p className="text-slate-600 text-[10px] mt-3 font-mono">{qual.year}</p>
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