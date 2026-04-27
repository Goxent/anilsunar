import React from 'react';
import { motion } from 'framer-motion';

const TECHNOLOGIES = [
    "React", "TypeScript", "Tailwind CSS", "Next.js", "Node.js",
    "Python", "Financial Analysis", "Auditing Standards", "Excel Macros",
    "Data Visualization", "Framer Motion", "Git", "SQL", "Taxation Law"
];

const TechStack: React.FC = () => {
    return (
        <section className="py-10 bg-surface-950 border-y border-white/5 overflow-hidden">
            <div className="flex">
                <motion.div
                    className="flex gap-8 md:gap-16 pr-8 md:pr-16"
                    animate={{ x: "-50%" }}
                    transition={{
                        ease: "linear",
                        duration: 20,
                        repeat: Infinity
                    }}
                >
                    {[...TECHNOLOGIES, ...TECHNOLOGIES].map((tech, index) => (
                        <div key={index} className="flex-shrink-0 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-400/40"></span>
                            <span className="text-slate-500 text-base md:text-lg font-medium tracking-wide whitespace-nowrap uppercase">
                                {tech}
                            </span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default TechStack;
