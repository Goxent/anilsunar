import React from 'react';
import { Mail, Linkedin, Youtube, Instagram, Github } from 'lucide-react';
import settings from '../src/content/settings.json';

const CONTACT_METHODS = [
  { label: 'Email', value: settings.contact?.email || 'Anil99senchury@gmail.com', href: `mailto:${settings.contact?.email || 'Anil99senchury@gmail.com'}`, icon: Mail },
  { label: 'LinkedIn', value: 'Anil Sunar', href: settings.social?.linkedin || 'https://www.linkedin.com/in/anil-sunar-842626229/', icon: Linkedin },
  { label: 'YouTube', value: '@goxent', href: settings.social?.youtube || 'https://www.youtube.com/@goxent', icon: Youtube },
  { label: 'GitHub', value: 'Goxent', href: settings.social?.github || 'https://github.com/Goxent', icon: Github },
];

const AVAILABLE_FOR = [
  'Audit Consulting',
  'Workflow Automation Projects',
  'Creative Collaborations',
  'Speaking'
];

const Footer: React.FC = () => {
  return (
    <footer id="contact" className="bg-surface-950 pt-32 pb-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <span className="text-accent-500 font-bold uppercase tracking-[0.3em] text-xs">Contact</span>
          <h2 className="text-5xl md:text-6xl font-serif mt-6 text-white">Let's Connect</h2>
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-accent-500/50 to-transparent mx-auto mt-8 mb-8"></div>
          <p className="text-slate-400 text-lg max-w-xl mx-auto font-light">
            Whether it's audit consulting, tech collaboration, or just a conversation about poetry — I'm always open.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-20">
          {CONTACT_METHODS.map((method) => (
            <a
              key={method.label}
              href={method.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-8 p-10 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-accent-500/30 transition-all duration-500 group shadow-lg hover:shadow-xl hover:shadow-accent-500/5"
            >
              <div className="p-4 rounded-2xl bg-surface-900 border border-white/5 text-slate-500 group-hover:text-accent-500 transition-colors">
                <method.icon size={32} />
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-widest text-accent-500 font-bold mb-2">{method.label}</span>
                <span className="text-2xl text-white group-hover:text-accent-300 transition-colors font-serif">{method.value}</span>
              </div>
            </a>
          ))}
        </div>

        <div className="flex flex-col items-center gap-8 py-12 border-y border-white/5 mb-12">
          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Available for</span>
          <div className="flex flex-wrap justify-center gap-4">
            {AVAILABLE_FOR.map((item) => (
              <span key={item} className="px-6 py-2.5 rounded-full border border-white/[0.06] text-slate-400 text-xs tracking-wider font-light bg-white/[0.01]">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="text-center text-slate-600 text-[10px] uppercase font-mono tracking-widest">
          &copy; {new Date().getFullYear()} Anil Sunar · Goxent. Built with React & Vite.
        </div>
      </div>
    </footer>
  );
};

export default Footer;