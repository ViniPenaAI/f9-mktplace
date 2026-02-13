import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const products = [
    {
        title: "Rótulos",
        category: "Indústria",
        description: "Rótulos de alta qualidade para bebidas, alimentos, cosméticos e produtos em geral. Materiais resistentes a umidade e óleo, com acabamento brilho ou fosco e opções de verniz localizado.",
        image: "/products/rotulos-embalagens-ia.jpg.png",
        gradient: "from-amber-400 to-orange-600",
        features: ["Alta definição", "Resistência", "Personalização total"],
    },
    {
        title: "Adesivos & Recorte",
        category: "Promocional",
        description: "Adesivos de recorte em vinil para eventos, divulgação e identidade visual. Recorte preciso em qualquer formato, com ou sem aplicação. Ideais para vitrines, veículos e ações de marketing.",
        image: "/products/adesivos-recorte-ia.jpg.png",
        gradient: "from-pink-400 to-rose-600",
        features: ["Recorte à prova", "Vários formatos", "Entrega rápida"],
    },
    {
        title: "Banners",
        category: "Eventos",
        description: "Banners e faixas para eventos, promoções e sinalização. Tecido ou lona de alta resistência, com impressão vibrante e acabamento reforçado. Perfeitos para fachadas, stands e campanhas.",
        image: "/products/banners-faixas-ia.jpg.png",
        gradient: "from-blue-400 to-indigo-600",
        features: ["Grande formato", "Cores vivas", "Durabilidade"],
    },
    {
        title: "Envelopamento de Frota",
        category: "Veículos",
        description: "Envelopamento completo ou parcial para carros, motos, caminhões e frotas. Vinil de alta performance com proteção UV e fácil remoção. Sua marca em movimento por toda a cidade.",
        image: "/products/envelopamento-frota-ia.jpg.png",
        gradient: "from-sky-400 to-indigo-600",
        features: ["Proteção da pintura", "Remoção sem resíduos", "Design exclusivo"],
    },
    {
        title: "Fachadas & Letreiros",
        category: "Sinalização",
        description: "Fachadas comerciais, letreiros em acrílico ou LED e sinalização interna e externa. Projetos que valorizam seu ponto de venda e reforçam sua identidade visual com profissionalismo.",
        image: "/products/fachadas-letreiros-ia.jpg.png",
        gradient: "from-purple-400 to-violet-600",
        features: ["Projeto sob medida", "Instalação", "Manutenção"],
    },
];

export default function ProdutosPage() {
    return (
        <main className="min-h-screen bg-background selection:bg-f9-cyan selection:text-f9-navy">
            <Header />

            <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 bg-gradient-to-br from-f9-navy via-indigo-950 to-f9-navy text-white overflow-hidden">
                <div className="absolute inset-0 bg-[url('/products/rotulos-embalagens-ia.jpg.png')] bg-cover bg-center opacity-10" />
                <div className="container relative z-10 mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4">
                        Nossos Produtos
                    </h1>
                    <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
                        Da ideia à impressão: rótulos, adesivos, banners, envelopamento e sinalização com qualidade profissional.
                    </p>
                </div>
            </section>

            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4">
                    <div className="space-y-24 md:space-y-32">
                        {products.map((product, index) => (
                            <article
                                key={product.title}
                                className={`grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center ${index % 2 === 1 ? "md:flex-row-reverse" : ""}`}
                            >
                                <div className={index % 2 === 1 ? "md:order-2" : ""}>
                                    <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3] bg-gray-100">
                                        <img
                                            src={product.image}
                                            alt={product.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div
                                            className={`absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60`}
                                        />
                                        <div
                                            className={`absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-white/90 backdrop-blur-sm`}
                                        >
                                            <span className="text-xs font-bold tracking-wider uppercase text-f9-navy/80">
                                                {product.category}
                                            </span>
                                            <h2 className="text-xl font-black text-f9-navy">{product.title}</h2>
                                        </div>
                                    </div>
                                </div>
                                <div className={index % 2 === 1 ? "md:order-1 md:text-right" : ""}>
                                    <span className="text-sm font-bold text-f9-cyan uppercase tracking-wider">
                                        {product.category}
                                    </span>
                                    <h2 className="text-2xl md:text-3xl font-black text-f9-navy mt-2 mb-4">
                                        {product.title}
                                    </h2>
                                    <p className="text-gray-600 leading-relaxed mb-6">
                                        {product.description}
                                    </p>
                                    <ul className="space-y-2 mb-8">
                                        {product.features.map((f) => (
                                            <li
                                                key={f}
                                                className={`flex items-center gap-2 text-gray-700 font-medium ${index % 2 === 1 ? "md:justify-end" : ""}`}
                                            >
                                                <span className="h-1.5 w-1.5 rounded-full bg-f9-cyan" />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                    <Link
                                        href="/#configurator"
                                        className={`inline-flex items-center gap-2 rounded-full bg-f9-green text-white font-bold px-6 py-3 shadow-[0_0_20px_rgba(74,222,128,0.4)] hover:bg-emerald-600 transition-colors ${index % 2 === 1 ? "md:ml-auto md:flex" : ""}`}
                                    >
                                        Personalizar agora <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-16 bg-gray-50 border-t border-gray-100">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-2xl md:text-3xl font-black text-f9-navy mb-4">
                        Não encontrou o que precisa?
                    </h2>
                    <p className="text-gray-600 max-w-xl mx-auto mb-8">
                        Fale com a gente pelo WhatsApp e conte sua ideia. Temos solução para diversos tipos de impressão e comunicação visual.
                    </p>
                    <a
                        href="https://wa.me/5512991169431?text=Quero%20fazer%20um%20or%C3%A7amento"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-[#25D366] text-white font-bold px-8 py-4 shadow-lg hover:bg-[#20BD5A] transition-colors"
                    >
                        Pedir orçamento no WhatsApp
                    </a>
                </div>
            </section>

            <Footer />
        </main>
    );
}
