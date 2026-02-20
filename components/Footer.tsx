import React from 'react';
import { SOCIAL_LINKS } from '../constants';
import { Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer id="contact" className="bg-slate-950 pt-20 pb-10 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-4xl md:text-6xl font-serif text-white mb-6">Let's Connect</h2>
            <p className="text-slate-400 text-lg max-w-md">
              Whether it's about a financial audit or a collaboration on a new track, I'm always open to interesting conversations.
            </p>

            <a href="mailto:Anil99senchury@gmail.com" className="inline-flex items-center gap-3 mt-8 text-gold-500 hover:text-gold-400 transition-colors text-xl font-medium group">
              <Mail />
              <span>Anil99senchury@gmail.com</span>
              <span className="h-px w-0 bg-gold-400 group-hover:w-full transition-all duration-300"></span>
            </a>
          </div>

          <div className="flex flex-col md:items-end gap-6">
            <span className="text-slate-500 text-sm uppercase tracking-widest">Social Media</span>
            <div className="flex gap-4">
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.platform}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-4 glass-card rounded-full text-slate-400 transition-all duration-300 hover:scale-110 hover:border-white/20 ${link.color}`}
                  aria-label={link.platform}
                >
                  <link.icon size={24} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 text-slate-600 text-sm">
          <p>&copy; {new Date().getFullYear()} Goxent. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;