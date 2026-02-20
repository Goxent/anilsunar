import React, { useEffect } from 'react';
import ReactLenis from '@studio-freight/react-lenis';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TechStack from './components/TechStack';
import About from './components/About';
import Experience from './components/Experience';
import Creative from './components/Creative';
import GeminiPoet from './components/GeminiPoet';
import Footer from './components/Footer';
import CustomCursor from './components/CustomCursor';

function App() {
  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5, smoothWheel: true }}>
      <div className="bg-luxury-950 text-slate-200 font-sans selection:bg-gold-500/30 selection:text-gold-200 cursor-none">
        <CustomCursor />
        <Navbar />
        <AnimatePresence mode="wait">
          <motion.main
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(10px)' }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} // Custom ease for premium feel
          >
            <Hero />
            <TechStack />
            <About />
            <Experience />
            <Creative />
            <GeminiPoet />
          </motion.main>
        </AnimatePresence>
        <Footer />
      </div>
    </ReactLenis>
  );
}

export default App;