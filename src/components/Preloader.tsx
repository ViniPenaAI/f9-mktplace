"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function Preloader() {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(false), 5000);
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
            {/* Container: mesmo eixo; máscaras centralizadas para centro e hexágonos não se sobreporem */}
            <div className="relative w-[300px] h-[300px] md:w-[300px] md:h-[300px] flex items-center justify-center">
                {/* Tamanho único para alinhar centro da máscara ao centro visual da logo */}
                <div className="relative w-[660px] h-[660px] md:w-[660px] md:h-[660px]">
                    {/* Camada 1: só hexágonos girando — máscara começa depois do centro para não ser “comido” */}
                    <motion.div
                        className="absolute inset-0"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        style={{
                            maskImage: "radial-gradient(circle at 50% 50%, transparent 50%, black 54%)",
                            WebkitMaskImage: "radial-gradient(circle at 50% 50%, transparent 10%, black 54%)",
                            maskSize: "100% 100%",
                            maskPosition: "center",
                            maskRepeat: "no-repeat",
                        }}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element -- preloader; máscara e rotação */}
                        <img
                            src="/f9-logo.png"
                            alt=""
                            role="presentation"
                            className="w-350 h-168 object-contain object-center"
                            style={{
                                filter: "grayscale(1) invert(1) brightness(1.1)",
                                mixBlendMode: "screen",
                            }}
                        />
                    </motion.div>

                    {/* Camada 2: centro da logo (arquivo próprio sem fundo) ocupando todo o espaço central */}
                    <div className="absolute inset-0 z-10 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element -- preloader; centro da logo */}
                        <img
                            src="/centro%20logo%20sem%20fundo.png"
                            alt="F9"
                            className="w-48 h-48 object-contain object-center"
                            style={{
                                filter: "drop-shadow(0 0 12px rgba(255,255,255,0.12))",
                            }}
                        />
                    </div>
                </div>
            </div>

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





