import React, { useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TechStack from './components/TechStack';
import About from './components/About';
import Experience from './components/Experience';
import Creative from './components/Creative';
import GeminiPoet from './components/GeminiPoet';
import Footer from './components/Footer';

function App() {
  // Smooth scroll behavior for anchor links
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <div className="bg-luxury-950 text-slate-200 font-sans selection:bg-gold-500/30 selection:text-gold-200">
      <Navbar />
      <main>
        <Hero />
        <TechStack />
        <About />
        <Experience />
        <Creative />
        <GeminiPoet />
      </main>
      <Footer />
    </div>
  );
}

export default App;