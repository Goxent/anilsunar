import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const CustomCursor: React.FC = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);

    useEffect(() => {
        const updateMousePosition = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Define what elements should trigger the hover effect (links, buttons, interactive cards)
            if (
                target.tagName.toLowerCase() === 'a' ||
                target.tagName.toLowerCase() === 'button' ||
                target.closest('a') !== null ||
                target.closest('button') !== null ||
                target.classList.contains('interactive') ||
                target.closest('.interactive') !== null
            ) {
                setIsHovering(true);
            } else {
                setIsHovering(false);
            }
        };

        window.addEventListener('mousemove', updateMousePosition);
        window.addEventListener('mouseover', handleMouseOver);

        return () => {
            window.removeEventListener('mousemove', updateMousePosition);
            window.removeEventListener('mouseover', handleMouseOver);
        };
    }, []);

    return (
        <>
            {/* Outer Ring (Trails behind) */}
            <motion.div
                className="fixed top-0 left-0 w-8 h-8 rounded-full border-2 border-gold-500/50 pointer-events-none z-[9999] hidden md:block mix-blend-screen"
                animate={{
                    x: mousePosition.x - 16,
                    y: mousePosition.y - 16,
                    scale: isHovering ? 2.5 : 1,
                    backgroundColor: isHovering ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
                    borderColor: isHovering ? 'rgba(251, 191, 36, 0.8)' : 'rgba(251, 191, 36, 0.5)',
                }}
                transition={{
                    type: 'spring',
                    stiffness: 150,
                    damping: 15,
                    mass: 0.5,
                }}
            />
            {/* Inner Dot (Instantly tracks) */}
            <motion.div
                className="fixed top-0 left-0 w-2 h-2 rounded-full bg-white pointer-events-none z-[9999] hidden md:block mix-blend-screen shadow-[0_0_10px_#fff]"
                animate={{
                    x: mousePosition.x - 4,
                    y: mousePosition.y - 4,
                    opacity: isHovering ? 0 : 1,
                }}
                transition={{
                    type: 'tween',
                    ease: 'linear',
                    duration: 0,
                }}
            />
        </>
    );
};

export default CustomCursor;
