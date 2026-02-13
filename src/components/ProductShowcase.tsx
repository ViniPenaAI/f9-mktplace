"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function ProductShowcase() {
    const pathname = usePathname();

    const handleGoToConfigurator = (e: React.MouseEvent) => {
        if (pathname === "/") {
            e.preventDefault();
            document.getElementById("configurator")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    const products = [
        {
            title: "Rótulos",
            category: "Indústria",
            gradient: "from-amber-400 to-orange-600",
            image: "/products/rotulos-embalagens-ia.jpg.png",
        },
        {
            title: "Adesivo de Recorte",
            category: "Promocional",
            gradient: "from-pink-400 to-rose-600",
            image: "/products/adesivos-recorte-ia.jpg.png",
        },
        {
            title: "Banners",
            category: "Eventos",
            gradient: "from-blue-400 to-indigo-600",
            image: "/products/banners-faixas-ia.jpg.png",
        },
        {
            title: "Envelopamento de Frota",
            category: "Veículos",
            // Usamos um gradiente mais neutro/azulado para não esverdear a foto
            gradient: "from-sky-400 to-indigo-600",
            image: "/products/envelopamento-frota-ia.jpg.png",
        },
        {
            title: "Fachadas & Letreiros",
            category: "Sinalização",
            gradient: "from-purple-400 to-violet-600",
            image: "/products/fachadas-letreiros-ia.jpg.png",
        },
    ];

    return (
        <div className="w-full max-w-6xl mx-auto px-4">
            <Carousel
                opts={{
                    align: "start",
                    loop: true,
                }}
                className="w-full"
            >
                <CarouselContent className="-ml-2 md:-ml-4">
                    {products.map((product, index) => (
                        <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                            <div className="p-1">
                                <Link href="/#configurator" onClick={handleGoToConfigurator} className="block">
                                    <Card className="border border-white/10 bg-white/5 backdrop-blur-md group cursor-pointer overflow-hidden rounded-2xl shadow-[0_0_0_rgba(0,0,0,0)] hover:shadow-[0_0_28px_rgba(15,23,42,0.8)] transition-shadow duration-300">
                                        <CardContent className="flex aspect-[3/4] items-center justify-center p-0 relative">
                                        {/* Product Image */}
                                        <img
                                            src={product.image}
                                            alt={product.title}
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />

                                        {/* Color / darkening overlay (ainda mais suave para destacar a foto) */}
                                        <div
                                            className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/15 to-transparent"
                                        />
                                        <div
                                            className={`absolute inset-0 bg-gradient-to-br ${product.gradient} opacity-15 group-hover:opacity-25 transition-opacity duration-300`}
                                        />

                                        {/* Content Overlay */}
                                        <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                                            <span className="text-xs font-bold tracking-wider uppercase opacity-80 mb-2">{product.category}</span>
                                            <h3 className="text-2xl font-black mb-4 leading-tight">{product.title}</h3>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="w-fit gap-2 rounded-full bg-white/90 text-f9-navy font-bold border border-white/40 backdrop-blur-md shadow-[0_0_18px_rgba(249,250,251,0.55)] opacity-0 group-hover:opacity-100 group-hover:bg-f9-cyan/90 group-hover:text-f9-navy transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:bg-f9-cyan hover:text-f9-navy"
                                            >
                                                Ver Detalhes <ArrowRight className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        {/* Decorative Elements */}
                                        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md rounded-full p-2">
                                            <ArrowRight className="w-5 h-5 text-white -rotate-45" />
                                        </div>
                                    </CardContent>
                                </Card>
                                </Link>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
        </div>
    );
}
