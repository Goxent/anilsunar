import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Experience from './components/Experience';
import Projects from './components/Projects';
import Creative from './components/Creative';
import Courses from './components/Courses';
import Posts from './components/Posts';
import GeminiPoet from './components/GeminiPoet';
import Footer from './components/Footer';

function App() {
  return (
    <div className="bg-surface-950 text-slate-200 font-sans selection:bg-accent-500/20 selection:text-accent-500 overflow-x-hidden w-full relative">
      <Navbar />
      <main className="overflow-x-hidden w-full relative">
        <Hero />
        <About />
        <Experience />
        <Projects />
        <Creative />
        <Courses />
        <Posts />
        <GeminiPoet />
      </main>
      <Footer />
    </div>
  );
}

export default App;