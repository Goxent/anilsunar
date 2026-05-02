import React from 'react';
import { motion } from 'framer-motion';

const PROFESSIONAL_SKILLS = [
    "Auditing Standards", "Taxation Law", "Financial Analysis", 
    "Tigg Certified", "Risk Assessment", "Corporate Governance", 
    "Nepal Standards on Auditing", "Compliance", "Internal Audit"
];

const TECHNICAL_SKILLS = [
    "React", "TypeScript", "Node.js", "Playwright", 
    "Tailwind CSS", "Python", "Gemini AI", "Git", 
    "Framer Motion", "Vite", "SQL", "Automation"
];

const TechStack: React.FC = () => {
    const Row = ({ skills, direction = 1, duration = 30 }: { skills: string[], direction?: number, duration?: number }) => (
        <div className="flex mb-10 last:mb-0">
            <motion.div
                className="flex gap-12 md:gap-24 pr-12 md:pr-24"
                animate={{ x: direction > 0 ? ["0%", "-50%"] : ["-50%", "0%"] }}
                transition={{
                    ease: "linear",
                    duration: duration,
                    repeat: Infinity
                }}
            >
                {[...skills, ...skills, ...skills].map((skill, index) => (
                    <div key={index} className="flex-shrink-0 flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-accent-500/20 shadow-[0_0_8px_rgba(212,175,55,0.3)]"></span>
                        <span className="text-slate-500 text-sm md:text-base font-bold tracking-[0.2em] whitespace-nowrap uppercase">
                            {skill}
                        </span>
                    </div>
                ))}
            </motion.div>
        </div>
    );

    return (
        <section className="py-20 bg-surface-950 border-y border-white/5 overflow-hidden">
            <div className="max-w-7xl mx-auto px-8 mb-12">
                <span className="text-accent-500/60 text-[10px] font-bold uppercase tracking-[0.4em]">Expertise</span>
            </div>
            
            <Row skills={PROFESSIONAL_SKILLS} direction={1} duration={40} />
            <Row skills={TECHNICAL_SKILLS} direction={-1} duration={35} />
        </section>
    );
};

export default TechStack;
