import Link from "next/link";
import { Facebook, Instagram, Linkedin, MessageCircle, MapPin, Mail, Phone } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-f9-navy text-white pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <div className="space-y-4">
                        <img src="/f9-logo.png" alt="F9" className="h-16 w-auto brightness-0 invert object-contain" />
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Soluções completas em comunicação visual.
                            Do design à entrega, garantimos qualidade e tecnologia em cada impressão.
                        </p>
                        <div className="flex items-center gap-4 pt-2">
                            <SocialLink href="#" icon={<Instagram className="w-5 h-5" />} />
                            <SocialLink href="#" icon={<Facebook className="w-5 h-5" />} />
                            <SocialLink href="#" icon={<Linkedin className="w-5 h-5" />} />
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 text-f9-cyan">Navegação</h3>
                        <ul className="space-y-3 text-gray-400 text-sm">
                            <li><Link href="/" className="hover:text-white transition-colors">Início</Link></li>
                            <li><Link href="#products" className="hover:text-white transition-colors">Produtos</Link></li>
                            <li><Link href="#configurator" className="hover:text-white transition-colors">Personalizar</Link></li>
                            <li><Link href="#cases" className="hover:text-white transition-colors">Portfólio</Link></li>
                            <li><Link href="#blog" className="hover:text-white transition-colors">Blog</Link></li>
                        </ul>
                    </div>

                    {/* Products */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 text-f9-yellow">Produtos</h3>
                        <ul className="space-y-3 text-gray-400 text-sm">
                            <li><Link href="#" className="hover:text-white transition-colors">Rótulos Adesivos</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Banners Promocionais</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Adesivos de Recorte</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Faixas</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Troféus em Acrílico</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 text-f9-magenta">Contato</h3>
                        <ul className="space-y-4 text-gray-400 text-sm">
                            <li className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-f9-magenta shrink-0" />
                                <span>Rua Exemplo, 1234 - Curitiba, PR<br />CEP 80000-000</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-f9-magenta shrink-0" />
                                <span>(41) 3333-3333</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-f9-magenta shrink-0" />
                                <span>contato@f9.com.br</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <MessageCircle className="w-5 h-5 text-f9-green shrink-0" />
                                <span className="text-f9-green font-bold">WhatsApp Comercial</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
                    <p>© {new Date().getFullYear()} F9 Comunicação Visual. Todos os direitos reservados.</p>
                    <div className="flex gap-6">
                        <Link href="#" className="hover:text-white">Política de Privacidade</Link>
                        <Link href="#" className="hover:text-white">Termos de Uso</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

function SocialLink({ href, icon }: { href: string; icon: React.ReactNode }) {
    return (
        <a
            href={href}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-f9-magenta hover:text-white transition-all duration-300"
        >
            {icon}
        </a>
    );
}
