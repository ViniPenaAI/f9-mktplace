"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function Preloader() {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Hide preloader after 5 seconds to let the animation play longer
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

    if (!isVisible) return null;

    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            animate={{ opacity: isVisible ? 1 : 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#020617]"
        >
            <div className="relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center">
                {/* Animated Outer Ring (The whole logo rotating) */}
                {/* We use filters to turn the image into a White-on-Black version, then use Screen blend mode to hide the black background */}
                <motion.img
                    src="/f9-logo.png"
                    alt="Loading..."
                    className="absolute inset-0 w-full h-full object-contain"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    style={{
                        // Mask out the center so we don't see the rotating F9
                        maskImage: "radial-gradient(transparent 35%, black 36%)",
                        WebkitMaskImage: "radial-gradient(transparent 35%, black 36%)",
                        filter: "grayscale(1) invert(1) brightness(100)",
                        mixBlendMode: "screen"
                    }}
                />

                {/* Static Center (The logo again, but only the center) */}
                {/* We use a mask to hide the outer ring of this static layer */}
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    {/* Dark circle to hide the white ring - matching background gradient */}
                    <div
                        className="absolute w-[65%] h-[65%] rounded-full bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#020617]"
                    />
                    <img
                        src="/f9-logo.png"
                        alt="F9"
                        className="w-full h-full object-contain relative z-10"
                        style={{
                            // Mask out the outside so we only see the static F9
                            maskImage: "radial-gradient(black 35%, transparent 36%)",
                            WebkitMaskImage: "radial-gradient(black 35%, transparent 36%)",
                            mixBlendMode: "screen",
                            filter: "drop-shadow(0 0 15px rgba(255,255,255,0.15))"
                        }}
                    />
                </div>

                {/* Optional Pulse Effect for Center */}
                <motion.div
                    className="absolute inset-0 z-20"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>

            {/* Slogan Text - Using Montserrat ExtraBold with reduced size */}
            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="mt-8 max-w-4xl mx-auto text-center text-white/90 text-xl md:text-2xl lg:text-3xl font-sans font-semibold tracking-[0.02em] leading-snug [text-wrap:balance] drop-shadow-[0_1px_18px_rgba(255,255,255,0.10)]"
            >
                Sua marca em todos os lugares!
            </motion.p>
        </motion.div>
    );
}
