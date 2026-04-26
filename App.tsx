import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TechStack from './components/TechStack';
import About from './components/About';
import Experience from './components/Experience';
import Projects from './components/Projects';
import Videos from './components/Videos';
import Creative from './components/Creative';
import Courses from './components/Courses';
import Posts from './components/Posts';
import GeminiPoet from './components/GeminiPoet';
import Footer from './components/Footer';
import CustomCursor from './components/CustomCursor';
import NewsletterSignup from './components/NewsletterSignup';

function App() {
  return (
    <div className="bg-luxury-950 text-slate-200 font-sans selection:bg-gold-500/30 selection:text-gold-200 cursor-none">
      <CustomCursor />
      <Navbar />
      <main>
        <Hero />
        <TechStack />
        <About />
        <Experience />
        <Projects />
        <Videos />
        <Creative />
        <Courses />
        <Posts />
        <GeminiPoet />
      </main>
      <NewsletterSignup />
      <Footer />
    </div>
  );
}

export default App;