import React from 'react';
import { Mail, Linkedin, Youtube, Instagram } from 'lucide-react';

const CONTACT_METHODS = [
  { label: 'Email', value: 'Anil99senchury@gmail.com', href: 'mailto:Anil99senchury@gmail.com', icon: Mail },
  { label: 'LinkedIn', value: 'Anil Sunar', href: 'https://www.linkedin.com/in/anil-sunar-842626229/', icon: Linkedin },
  { label: 'YouTube', value: '@goxent', href: 'https://www.youtube.com/@goxent', icon: Youtube },
  { label: 'Instagram', value: '@goxent', href: 'https://www.instagram.com/goxent', icon: Instagram },
];

const AVAILABLE_FOR = [
  'Audit Consulting',
  'Workflow Automation Projects',
  'Creative Collaborations',
  'Speaking'
];

const Footer: React.FC = () => {
  return (
    <footer id="contact" className="bg-luxury-950 pt-32 pb-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <span className="text-gold-500 font-bold uppercase tracking-[0.3em] text-xs">Contact</span>
          <h2 className="text-5xl md:text-6xl font-serif mt-6 text-white mb-6">Let's Connect</h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto font-light">
            Whether it's audit consulting, tech collaboration, or just a conversation about poetry — I'm always open.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-20">
          {CONTACT_METHODS.map((method) => (
            <a
              key={method.label}
              href={method.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-6 p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-gold-500/30 transition-all duration-500 group"
            >
              <div className="p-4 rounded-2xl bg-luxury-900 text-slate-400 group-hover:text-gold-500 transition-colors">
                <method.icon size={28} />
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">{method.label}</span>
                <span className="text-xl text-white group-hover:text-gold-400 transition-colors font-serif">{method.value}</span>
              </div>
            </a>
          ))}
        </div>

        <div className="flex flex-col items-center gap-8 py-12 border-y border-white/5 mb-12">
          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Available for</span>
          <div className="flex flex-wrap justify-center gap-4">
            {AVAILABLE_FOR.map((item) => (
              <span key={item} className="px-5 py-2 rounded-full border border-white/10 text-slate-400 text-xs tracking-wider">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="text-center text-slate-600 text-xs font-mono tracking-widest">
          &copy; {new Date().getFullYear()} Anil Sunar · Goxent. Built with React & Vite.
        </div>
      </div>
    </footer>
  );
};

export default Footer;