import React, { useState, useEffect } from 'react';
import { useScrollReveal } from './utils/useScrollReveal';
import { db } from './src/app/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Components
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Experience from './components/Experience';
import Projects from './components/Projects';
import Creative from './components/Creative';
import Courses from './components/Courses';
import Posts from './components/Posts';
import Footer from './components/Footer';
import { SiteSettingsContext } from './src/context';

// Define the component map for dynamic rendering
const COMPONENT_MAP: Record<string, React.FC<any>> = {
  hero: Hero,
  about: About,
  experience: Experience,
  projects: Projects,
  creative: Creative,
  courses: Courses,
  posts: Posts
};

const DEFAULT_SECTIONS = [
  { id: 'hero',       visible: true },
  { id: 'about',      visible: true },
  { id: 'experience', visible: true },
  { id: 'projects',   visible: true },
  { id: 'creative',   visible: true },
  { id: 'courses',    visible: true },
  { id: 'posts',      visible: true }
];



function App() {
  useScrollReveal();
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const snap = await getDoc(doc(db, 'settings', 'landing_page'));
        if (snap.exists()) {
          const data = snap.data();
          if (data.sections) setSections(data.sections);
          setSiteSettings(data);
        }
      } catch (err) {
        console.error("Failed to fetch dynamic site config:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  if (loading && !siteSettings) return (
    <div className="bg-surface-950 min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-t-2 border-accent-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <SiteSettingsContext.Provider value={siteSettings}>
      <div className="bg-surface-950 text-slate-200 font-sans selection:bg-accent-500/20 selection:text-accent-500 overflow-x-hidden w-full relative">
        <Navbar />
        <main className="overflow-x-hidden w-full relative">
          {sections.map((section) => {
            const Component = COMPONENT_MAP[section.id];
            if (!Component || !section.visible) return null;
            return <Component key={section.id} />;
          })}
        </main>
        <Footer />
      </div>
    </SiteSettingsContext.Provider>
  );
}

export default App;