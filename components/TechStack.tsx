import React from 'react';
import { motion } from 'framer-motion';

const TECHNOLOGIES = [
    "React", "TypeScript", "Tailwind CSS", "Next.js", "Node.js",
    "Python", "Financial Analysis", "Auditing Standards", "Excel Macros",
    "Data Visualization", "Framer Motion", "Git", "SQL", "Taxation Law"
];

const TechStack: React.FC = () => {
    return (
        <section className="py-10 bg-luxury-950 border-y border-white/5 overflow-hidden">
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
                            <span className="w-2 h-2 rounded-full bg-gold-500/50"></span>
                            <span className="text-slate-400 text-lg md:text-xl font-medium tracking-wide whitespace-nowrap uppercase">
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
