import React from 'react';
import { Mail, Linkedin, Youtube, Instagram, Github, MessageSquare } from 'lucide-react';
import settings from '../src/content/settings.json';

const CONTACT_METHODS = [
  { label: 'Email', value: settings.contact?.email || 'Anil99senchury@gmail.com', href: `mailto:${settings.contact?.email || 'Anil99senchury@gmail.com'}`, icon: Mail },
  { label: 'LinkedIn', value: 'Anil Sunar', href: settings.social?.linkedin || 'https://www.linkedin.com/in/anil-sunar-842626229/', icon: Linkedin },
  { label: 'Instagram', value: '@goxent', href: settings.social?.instagram || 'https://www.instagram.com/goxent', icon: Instagram },
  { label: 'YouTube', value: '@goxent', href: settings.social?.youtube || 'https://www.youtube.com/@goxent', icon: Youtube },
];

const SERVICES = [
  {
    title: 'Audit & Assurance',
    description: 'Statutory audits, internal control reviews, and risk assessment for firms and corporate clients.',
    tags: ['Compliance', 'NSA', 'Taxation']
  },
  {
    title: 'Workflow Automation',
    description: 'Custom full-stack tools to automate repetitive business processes and data pipelines.',
    tags: ['Node.js', 'Playwright', 'Notion']
  },
  {
    title: 'Creative Collaboration',
    description: 'Spoken word, lyrical writing, and creative direction for brands and musical projects.',
    tags: ['Rap', 'Poetry', 'Direction']
  }
];

const Footer: React.FC = () => {
  return (
    <footer id="contact" className="bg-surface-950 pt-32 pb-12 border-t border-white/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent-500/[0.03] rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-8 md:px-16 lg:px-24">
        <div className="text-center mb-24">
          <span className="text-accent-500 font-bold uppercase tracking-[0.4em] text-xs">Collaboration</span>
          <h2 className="text-5xl md:text-7xl font-serif mt-6 text-white font-bold">Ready to <span className="italic text-accent-500/90">Engage?</span></h2>
          <div className="h-px w-32 bg-gradient-to-r from-transparent via-accent-500/50 to-transparent mx-auto mt-10 mb-10"></div>
          <p className="text-slate-400 text-xl max-w-2xl mx-auto font-light leading-relaxed">
            Whether you need professional audit consulting, technical automation, or a creative partner — let's build something meaningful together.
          </p>
        </div>

        {/* Services / Available For */}
        <div className="grid md:grid-cols-3 gap-8 mb-24">
          {SERVICES.map((service) => (
            <div key={service.title} className="p-8 rounded-3xl bg-white/[0.01] border border-white/5 hover:border-accent-500/20 transition-all duration-500 group">
              <h3 className="text-xl font-bold text-white mb-4 font-serif group-hover:text-accent-500 transition-colors">{service.title}</h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed font-light">{service.description}</p>
              <div className="flex flex-wrap gap-2">
                {service.tags.map(tag => (
                  <span key={tag} className="text-[9px] uppercase tracking-widest text-slate-400 bg-white/5 px-2 py-1 rounded">{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Primary Contact CTA */}
        <div className="flex justify-center mb-24">
            <a 
                href={`mailto:${settings.contact?.email || 'Anil99senchury@gmail.com'}`}
                className="group relative px-12 py-6 bg-accent-500 text-surface-950 rounded-full font-bold uppercase tracking-[0.3em] text-sm overflow-hidden transition-all duration-500 hover:shadow-[0_0_40px_rgba(212,175,55,0.4)]"
            >
                <span className="relative z-10 flex items-center gap-3">
                    <MessageSquare size={20} />
                    Start a Conversation
                </span>
                <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500 opacity-10"></div>
            </a>
        </div>

        {/* Contact Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-24">
          {CONTACT_METHODS.map((method) => (
            <a
              key={method.label}
              href={method.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-accent-500/30 transition-all duration-500 group"
            >
              <div className="p-4 rounded-2xl bg-surface-900 border border-white/5 text-slate-500 group-hover:text-accent-500 group-hover:scale-110 transition-all duration-500">
                <method.icon size={24} />
              </div>
              <div className="text-center">
                <span className="block text-[9px] uppercase tracking-widest text-accent-500 font-bold mb-1 opacity-60 group-hover:opacity-100 transition-opacity">{method.label}</span>
                <span className="text-sm text-white/80 group-hover:text-white transition-colors font-medium truncate max-w-[120px] inline-block">{method.value}</span>
              </div>
            </a>
          ))}
        </div>

        <div className="text-center pt-12 border-t border-white/5">
          <div className="text-slate-600 text-[10px] uppercase font-mono tracking-widest mb-4">
            &copy; {new Date().getFullYear()} Anil Sunar · Goxent. Built with React & Vite.
          </div>
          <div className="flex justify-center gap-4 text-slate-700 text-[9px] uppercase tracking-widest">
            <span>Portfolio</span>
            <span className="text-accent-500/20">•</span>
            <span>Audit</span>
            <span className="text-accent-500/20">•</span>
            <span>Tech</span>
            <span className="text-accent-500/20">•</span>
            <span>Art</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
