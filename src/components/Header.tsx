"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useScroll, useMotionValueEvent } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, ShoppingCart, User } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Header() {
    const { scrollY } = useScroll();
    const [isScrolled, setIsScrolled] = useState(false);

    useMotionValueEvent(scrollY, "change", (latest) => {
        setIsScrolled(latest > 50);
    });

    const navLinks = [
        { name: "Início", href: "/" },
        { name: "Produtos", href: "#products" },
        { name: "Diferenciais", href: "#features" },
        { name: "Contato", href: "#contact" },
    ];

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                isScrolled
                    ? "bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 py-3"
                    : "bg-transparent py-5"
            )}
        >
            <div className="container mx-auto px-4 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <img src="/f9-logo.png" alt="F9" className="h-16 md:h-20 w-auto object-contain transition-all duration-300" />
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={cn(
                                "text-sm font-medium hover:text-f9-magenta transition-colors",
                                isScrolled ? "text-gray-700" : "text-white/90"
                            )}
                        >
                            {link.name}
                        </Link>
                    ))}
                </nav>

                {/* Actions */}
                <div className="hidden md:flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "hover:bg-white/10",
                            isScrolled ? "text-gray-700 hover:text-primary" : "text-white"
                        )}
                    >
                        <User className="h-5 w-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "hover:bg-white/10 relative",
                            isScrolled ? "text-gray-700 hover:text-primary" : "text-white"
                        )}
                    >
                        <ShoppingCart className="h-5 w-5" />
                        <span className="absolute top-1 right-1 h-2 w-2 bg-f9-cyan rounded-full animate-pulse" />
                    </Button>
                    <Button
                        className={cn(
                            "rounded-full px-6 font-bold border transition-all",
                            isScrolled
                                ? "bg-white text-f9-green border-emerald-200 shadow-[0_0_25px_rgba(74,222,128,0.55)] hover:bg-emerald-50 hover:text-f9-green"
                                : "bg-f9-green/85 text-white border-emerald-300 shadow-[0_0_18px_rgba(37,211,102,0.55)] hover:bg-f9-green hover:text-white"
                        )}
                    >
                        Orçamento
                    </Button>
                </div>

                {/* Mobile Menu */}
                <div className="md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className={isScrolled ? "text-black" : "text-white"}>
                                <Menu className="w-6 h-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent>
                            <div className="flex flex-col gap-4 mt-8">
                                {navLinks.map((link) => (
                                    <Link key={link.name} href={link.href} className="text-lg font-medium">
                                        {link.name}
                                    </Link>
                                ))}
                                <Button className="w-full rounded-full mt-4 bg-white text-f9-green border border-emerald-200 hover:bg-emerald-50 font-bold shadow-[0_0_20px_rgba(74,222,128,0.5)]">
                                    Orçamento Rápido
                                </Button>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
