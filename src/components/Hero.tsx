"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function Hero() {
    return (
        <section className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-f9-navy text-white">
            {/* Background with Gradient/Video Overlay */}
            {/* Background with Video Overlay */}
            <div className="absolute inset-0 z-0">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-100"
                    onError={(e) => console.error('Video failed to load:', e)}
                    onLoadedData={() => console.log('Video loaded successfully!')}
                >
                    <source src="/Video%20header%20F9.mp4" type="video/mp4" />
                    Seu navegador não suporta vídeo HTML5.
                </video>
                <div className="absolute inset-0 bg-gradient-to-br from-f9-navy via-indigo-950/80 to-black/90" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-f9-magenta/20 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-f9-cyan/20 blur-[120px] rounded-full mix-blend-screen" />
            </div>

            <div className="container relative z-10 px-4 text-center flex flex-col items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="space-y-6"
                >
                    <div></div>
                    <div></div>
                    <div></div>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-tight max-w-5xl mx-auto">
                        Da Ideia à Impressão <br />
                        <span className="relative inline-block mt-2 text-2xl md:text-3xl lg:text-4xl font-extrabold [text-wrap:balance] drop-shadow-[0_2px_18px_rgba(0,0,0,0.75)]">
                            {/* Brilho suave no fundo da frase */}
                            <span className="pointer-events-none absolute -inset-x-10 -inset-y-2 bg-gradient-to-r from-transparent via-white/25 to-transparent blur-lg" />
                            {/* Texto com transparência nas pontas */}
                            <span className="relative block bg-clip-text text-transparent bg-gradient-to-r from-white/70 via-white to-white/70">
                                Divulgue sua Marca de forma rápida e fácil,
                                <br />
                                sem complicação.
                            </span>
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                        Plataforma completa para criar e configurar diversos tipos de produtos personalizados.
                        Use nossa IA para gerar designs únicos ou envie sua arte pronta.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                        <Button
                            size="lg"
                            className="w-full sm:w-auto bg-f9-blue/80 border border-white/40 text-white font-bold h-14 px-8 text-lg rounded-full backdrop-blur-md shadow-[0_0_20px_rgba(30,0,255,0.35)] transition-transform hover:scale-105 hover:bg-f9-blue"
                        >
                            Começar Agora
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
