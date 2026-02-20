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
          className="relative aspect-[4/5] md:aspect-square rounded-2xl overflow-hidden glass-card group"
          initial={{ opacity: 0, x: -50 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          {/* Using a high-quality abstract placeholder or actual image if provided */}
          <img
            src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=2071&auto=format&fit=crop"
            alt="Anil Sunar"
            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-luxury-950 via-transparent to-transparent opacity-90"></div>

          <div className="absolute bottom-6 left-6 right-6">
            <div className="text-gold-500 text-xs font-bold tracking-widest uppercase mb-2">My Philosophy</div>
            <p className="text-white font-serif text-xl italic">
              "Precision in numbers, fluidity in words."
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
              A Balance of <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600 italic">Logic</span> and <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600 italic">Lyricism</span>
            </h2>
          </div>

          <div className="space-y-6 text-slate-400 text-lg leading-relaxed">
            <p>
              I inhabit two worlds often seen as opposites. As a <strong className="text-white font-medium">CA Semi-Qualified Professional</strong>, I navigate the rigorous landscape of audits, financial reporting, and compliance with unwavering precision.
            </p>
            <p>
              But when the ledger closes, the notebook opens. As a <strong className="text-white font-medium">Poet and Rapper</strong>, I explore the human experience through rhythm and rhyme, finding structure in chaos just as I find stories in numbers.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/10">
            <div>
              <h3 className="text-5xl font-serif text-white flex items-baseline">
                3<span className="text-gold-500 text-2xl">+</span>
              </h3>
              <p className="text-sm text-slate-500 uppercase tracking-wider mt-2">Years Experience</p>
            </div>
            <div>
              <h3 className="text-5xl font-serif text-white flex items-baseline">
                100<span className="text-gold-500 text-2xl">+</span>
              </h3>
              <p className="text-sm text-slate-500 uppercase tracking-wider mt-2">Audits Completed</p>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default About;