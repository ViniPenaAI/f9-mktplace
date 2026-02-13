"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useScroll, useMotionValueEvent } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Menu, ShoppingCart, User, LogIn } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from "@/components/ui/sheet";
import { useConfiguratorStore } from "@/store/configurator-store";
import { useCartStore } from "@/store/cart-store";
import { useCartDrawerStore } from "@/store/cart-drawer-store";
import { useAuth } from "@/contexts/AuthContext";

const WHATSAPP_ORCAMENTO = "https://wa.me/5512991169431?text=Quero%20fazer%20um%20or%C3%A7amento";

export function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const resetConfig = useConfiguratorStore((s) => s.reset);
    const cartCount = useCartStore((s) => s.items.length);
    const { user, loading: authLoading, signIn, signOut } = useAuth();
    const { scrollY } = useScroll();
    const [isScrolled, setIsScrolled] = useState(false);
    const [userSheetOpen, setUserSheetOpen] = useState(false);
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginError, setLoginError] = useState<string | null>(null);

    useMotionValueEvent(scrollY, "change", (latest) => {
        setIsScrolled(latest > 50);
    });

    const handleInicio = () => {
        if (pathname === "/") {
            if (typeof window !== "undefined") window.history.replaceState(null, "", "/");
            window.scrollTo({ top: 0, behavior: "smooth" });
            resetConfig();
        } else {
            router.push("/");
        }
    };

    const navLinks = [
        { name: "Início", href: "/", isInicio: true },
        { name: "Produtos", href: "/produtos", isInicio: false },
        { name: "Diferenciais", href: "/diferenciais", isInicio: false },
        { name: "Contato", href: "/#contact", isInicio: false },
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
                    <Image src="/f9-logo.png" alt="F9" width={160} height={80} className="h-16 md:h-20 w-auto object-contain transition-all duration-300" />
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) =>
                        link.isInicio ? (
                            <button
                                key={link.name}
                                type="button"
                                onClick={handleInicio}
                                className={cn(
                                    "text-sm font-medium hover:text-f9-magenta transition-colors",
                                    isScrolled ? "text-gray-700" : "text-white/90"
                                )}
                            >
                                {link.name}
                            </button>
                        ) : (
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
                        )
                    )}
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
                        onClick={() => setUserSheetOpen(true)}
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
                        onClick={() => useCartDrawerStore.getState().openDrawer()}
                    >
                        <span className="relative inline-flex">
                            <ShoppingCart className="h-5 w-5" />
                            {cartCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-f9-cyan text-[10px] font-bold text-white">
                                    {cartCount > 99 ? "99+" : cartCount}
                                </span>
                            )}
                        </span>
                    </Button>
                    <Button
                        asChild
                        className={cn(
                            "rounded-full px-6 font-bold border transition-all",
                            isScrolled
                                ? "bg-white text-f9-green border-emerald-200 shadow-[0_0_25px_rgba(74,222,128,0.55)] hover:bg-emerald-50 hover:text-f9-green"
                                : "bg-f9-green/85 text-white border-emerald-300 shadow-[0_0_18px_rgba(37,211,102,0.55)] hover:bg-f9-green hover:text-white"
                        )}
                    >
                        <a href={WHATSAPP_ORCAMENTO} target="_blank" rel="noopener noreferrer">
                            Orçamento
                        </a>
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
                        <SheetContent
                            className="w-[min(260px,78vw)] max-w-[260px] bg-slate-900 border-0 px-0 py-0 text-white shadow-2xl"
                            side="right"
                        >
                            <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
                            <div className="flex flex-col h-full pt-14 pb-6">
                                <nav className="flex flex-col gap-0.5 px-6">
                                    {navLinks.map((link) =>
                                        link.isInicio ? (
                                            <SheetClose asChild key={link.name}>
                                                <button
                                                    type="button"
                                                    onClick={handleInicio}
                                                    className="text-left py-3 text-[15px] font-medium text-white/90 hover:text-white hover:bg-white/5 rounded-lg px-3 -mx-3 transition-colors"
                                                >
                                                    {link.name}
                                                </button>
                                            </SheetClose>
                                        ) : (
                                            <Link
                                                key={link.name}
                                                href={link.href}
                                                className="py-3 text-[15px] font-medium text-white/90 hover:text-white hover:bg-white/5 rounded-lg px-3 -mx-3 transition-colors"
                                            >
                                                {link.name}
                                            </Link>
                                        )
                                    )}
                                </nav>
                                <div className="flex-1 border-t border-white/10 my-4 mx-6" aria-hidden />
                                <div className="flex flex-col gap-1 px-6">
                                    <button
                                        type="button"
                                        className="flex items-center gap-3 text-left py-3 text-[15px] font-medium text-white/90 hover:text-white hover:bg-white/5 rounded-lg px-3 -mx-3 transition-colors"
                                        onClick={() => useCartDrawerStore.getState().openDrawer()}
                                    >
                                        <ShoppingCart className="h-5 w-5 shrink-0 text-white/80" />
                                        Carrinho {cartCount > 0 ? `(${cartCount})` : ""}
                                    </button>
                                    <SheetClose asChild>
                                        <button
                                            type="button"
                                            className="flex items-center gap-3 text-left py-3 text-[15px] font-medium text-white/90 hover:text-white hover:bg-white/5 rounded-lg px-3 -mx-3 transition-colors w-full"
                                            onClick={() => setUserSheetOpen(true)}
                                        >
                                            {user ? <User className="h-5 w-5 shrink-0 text-white/80" /> : <LogIn className="h-5 w-5 shrink-0 text-white/80" />}
                                            {user ? "Minha conta" : "Fazer login"}
                                        </button>
                                    </SheetClose>
                                </div>
                                <div className="mt-auto px-6 pt-4">
                                    <Button asChild className="w-full rounded-full bg-f9-green/90 text-white border border-emerald-400/50 hover:bg-f9-green font-bold shadow-[0_0_18px_rgba(74,222,128,0.4)]">
                                        <a href={WHATSAPP_ORCAMENTO} target="_blank" rel="noopener noreferrer">
                                            Orçamento Rápido
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* User Sheet: login ou menu logado */}
                <Sheet open={userSheetOpen} onOpenChange={(open) => { setUserSheetOpen(open); if (!open) { setLoginError(null); setLoginPassword(""); } }}>
                    <SheetContent side="right" className="w-[min(340px,92vw)] p-0 bg-white border-gray-200 shadow-xl overflow-hidden flex flex-col">
                        <SheetTitle className="sr-only">{user ? "Minha conta" : "Fazer log-in"}</SheetTitle>
                        <div className="flex flex-col flex-1 overflow-y-auto">
                            {authLoading ? (
                                <div className="p-8 flex items-center justify-center">
                                    <p className="text-sm text-gray-500">Carregando...</p>
                                </div>
                            ) : user ? (
                                <div className="p-6">
                                    <p className="text-sm font-medium text-gray-700 truncate" title={user.email}>{user.email}</p>
                                    <nav className="flex flex-col gap-0.5 mt-4">
                                        <SheetClose asChild>
                                            <Link href="/meus-pedidos" className="rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                                                Meus pedidos
                                            </Link>
                                        </SheetClose>
                                        <SheetClose asChild>
                                            <Link href="/perfil" className="rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                                                Perfil
                                            </Link>
                                        </SheetClose>
                                        <button
                                            type="button"
                                            className="rounded-lg px-3 py-2.5 text-sm text-left text-gray-700 hover:bg-gray-100 transition-colors"
                                            onClick={() => useCartDrawerStore.getState().openDrawer()}
                                        >
                                            Carrinho {cartCount > 0 ? `(${cartCount})` : ""}
                                        </button>
                                        <button
                                            type="button"
                                            className="rounded-lg px-3 py-2.5 text-sm text-left text-red-600 hover:bg-red-50 transition-colors mt-1"
                                            onClick={() => { signOut(); setUserSheetOpen(false); }}
                                        >
                                            Sair
                                        </button>
                                    </nav>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-gradient-to-br from-slate-50 to-gray-100 px-6 pt-8 pb-6 border-b border-gray-100">
                                        <h3 className="text-lg font-semibold text-f9-navy">Fazer log-in</h3>
                                        <p className="text-sm text-gray-500 mt-1">Acesse sua conta para acompanhar pedidos</p>
                                    </div>
                                    <form
                                        className="p-6 space-y-4"
                                        onSubmit={async (e) => {
                                            e.preventDefault();
                                            setLoginError(null);
                                            const email = loginEmail.trim().toLowerCase();
                                            const password = loginPassword;
                                            if (!email || !password) {
                                                setLoginError("Preencha e-mail e senha.");
                                                return;
                                            }
                                            const { error } = await signIn(email, password);
                                            if (error) {
                                                setLoginError(error);
                                                return;
                                            }
                                            setUserSheetOpen(false);
                                        }}
                                    >
                                        <div className="space-y-2">
                                            <Label htmlFor="header-login-email" className="text-gray-700">E-mail</Label>
                                            <Input
                                                id="header-login-email"
                                                type="email"
                                                value={loginEmail}
                                                onChange={(e) => setLoginEmail(e.target.value)}
                                                placeholder="email@exemplo.com"
                                                className="mt-0 rounded-lg border-gray-300 focus:border-f9-magenta focus:ring-f9-magenta/20"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="header-login-password" className="text-gray-700">Senha</Label>
                                            <Input
                                                id="header-login-password"
                                                type="password"
                                                value={loginPassword}
                                                onChange={(e) => setLoginPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="mt-0 rounded-lg border-gray-300 focus:border-f9-magenta focus:ring-f9-magenta/20"
                                            />
                                        </div>
                                        {loginError && (
                                            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{loginError}</p>
                                        )}
                                        <Button
                                            type="submit"
                                            className="w-full rounded-lg bg-f9-magenta hover:bg-f9-magenta/90 text-white font-medium shadow-sm"
                                        >
                                            Fazer log-in
                                        </Button>
                                    </form>
                                    <div className="px-6 pb-8 pt-2">
                                        <div className="rounded-xl bg-gray-50/80 border border-gray-100 p-4 space-y-3">
                                            <SheetClose asChild>
                                                <Link href="/esqueci-senha" className="block text-sm text-gray-600 hover:text-f9-magenta transition-colors">
                                                    Esqueci minha senha
                                                </Link>
                                            </SheetClose>
                                            <SheetClose asChild>
                                                <Link href="/cadastro" className="block text-sm text-gray-600 hover:text-f9-magenta transition-colors">
                                                    Quero me cadastrar
                                                </Link>
                                            </SheetClose>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    );
}
