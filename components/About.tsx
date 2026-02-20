import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const About: React.FC = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="about" className="py-24 md:py-32 relative bg-luxury-900 overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div ref={ref} className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">

        {/* Image / Visual Placeholder */}
        <motion.div
          className="relative aspect-[4/5] md:aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl shadow-gold-500/5 border border-white/10 group"
          initial={{ opacity: 0, x: -50 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, type: "spring", stiffness: 50 }}
        >
          {/* Using a high-quality premium abstract image */}
          <img
            src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974&auto=format&fit=crop"
            alt="Goxent"
            className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all duration-1000 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-luxury-950 via-luxury-950/40 to-transparent opacity-90"></div>

          <div className="absolute inset-0 border border-white/10 rounded-3xl scale-95 group-hover:scale-100 transition-transform duration-700 pointer-events-none"></div>

          <div className="absolute bottom-8 left-8 right-8">
            <div className="flex items-center gap-3 mb-3">
              <span className="h-px w-8 bg-gold-500"></span>
              <div className="text-gold-500 text-xs font-bold tracking-widest uppercase">My Philosophy</div>
            </div>
            <p className="text-white font-serif text-2xl italic leading-relaxed">
              "Precision in numbers, <br /> fluidity in words."
            </p>
          </div>
        </motion.div>

        {/* Text Content */}
        <motion.div
          className="space-y-8"
          initial={{ opacity: 0, x: 50 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div>
            <span className="text-gold-500 uppercase tracking-widest text-sm font-semibold">About Me</span>
            <h2 className="text-4xl md:text-6xl font-serif mt-4 mb-6 leading-tight text-white">
              A Blend of <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600 italic">Tech</span>, <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600 italic">Logic</span>, and <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600 italic">Lyricism</span>
            </h2>
          </div>

          <div className="space-y-6 text-slate-400 text-lg leading-relaxed">
            <p>
              I inhabit multiple worlds often seen as distinct. As an <strong className="text-white font-medium">Auditor</strong>, I navigate the rigorous landscape of financial reporting and compliance with unwavering precision.
            </p>
            <p>
              Simultaneously, I am a passionate <strong className="text-white font-medium">Tech Enthusiast and UI/UX Designer</strong>. I love crafting premium, beautiful digital experiences, ensuring every pixel feels intentional and luxurious.
            </p>
            <p>
              But when the screens turn off, the notebook opens. As a <strong className="text-white font-medium">Poet and Rapper</strong>, I explore the human experience through rhythm and rhyme, finding stories in art just as I find structure in audits and design.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/10">
            <div>
              <h3 className="text-4xl md:text-5xl font-serif text-white flex items-baseline">
                Multidisciplinary
              </h3>
              <p className="text-sm text-slate-500 uppercase tracking-wider mt-2">Approach</p>
            </div>
            <div>
              <h3 className="text-4xl md:text-5xl font-serif text-white flex items-baseline">
                Premium
              </h3>
              <p className="text-sm text-slate-500 uppercase tracking-wider mt-2">UI/UX Design</p>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default About;