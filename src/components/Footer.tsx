import Link from "next/link";
import { Facebook, Instagram, Linkedin, MapPin, Mail, Phone } from "lucide-react";

export function Footer() {
    return (
        <footer id="contact" className="bg-f9-navy text-white pt-16 pb-8 scroll-mt-20">
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
                            <li><Link href="/produtos" className="hover:text-white transition-colors">Produtos</Link></li>
                            <li><Link href="/diferenciais" className="hover:text-white transition-colors">Diferenciais</Link></li>
                            <li><Link href="/#configurator" className="hover:text-white transition-colors">Personalizar</Link></li>
                            <li><Link href="/#contact" className="hover:text-white transition-colors">Contato</Link></li>
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
                                <MapPin className="w-5 h-5 text-f9-magenta shrink-0 mt-0.5" />
                                <span>
                                    R. Teresinha Ribeiro Moreira, 40 - Segundo - Retiro da Mantiqueira<br />
                                    Cruzeiro - SP, 12701-000
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-f9-magenta shrink-0" />
                                <a href="https://wa.me/5512991169431" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                                    (12) 99116-9431
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-f9-magenta shrink-0" />
                                <a href="mailto:fabio@f9agencia.com.br" className="hover:text-white transition-colors">
                                    fabio@f9agencia.com.br
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Instagram className="w-5 h-5 text-f9-magenta shrink-0" />
                                <a href="https://instagram.com/comunicacao_visual_f9" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                                    @comunicacao_visual_f9
                                </a>
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

function SocialLink({
    href,
    icon,
    target,
    rel,
}: {
    href: string;
    icon: React.ReactNode;
    target?: string;
    rel?: string;
}) {
    return (
        <a
            href={href}
            target={target}
            rel={rel}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-f9-magenta hover:text-white transition-all duration-300"
        >
            {icon}
        </a>
    );
}
