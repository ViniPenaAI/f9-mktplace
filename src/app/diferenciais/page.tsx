import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
    Zap,
    ShieldCheck,
    Truck,
    Palette,
    Headphones,
    Award,
    CheckCircle2,
} from "lucide-react";
import Link from "next/link";

const differentials = [
    {
        icon: Zap,
        title: "Produção Express",
        description: "Processo automatizado e equipe preparada para enviar seu pedido em até 48h após aprovação da arte. Menos espera, mais resultado.",
        color: "text-f9-cyan",
        bg: "bg-f9-cyan/10",
        border: "border-f9-cyan/20",
    },
    {
        icon: ShieldCheck,
        title: "Qualidade Garantida",
        description: "Se não ficar satisfeito com a impressão, reimprimimos seu material sem custo adicional. Trabalhamos com calibração de cores e materiais de primeira.",
        color: "text-f9-green",
        bg: "bg-f9-green/10",
        border: "border-f9-green/20",
    },
    {
        icon: Truck,
        title: "Entrega para Todo o Brasil",
        description: "Parceria com as melhores transportadoras. Cotação de frete na hora do pedido e rastreio até a entrega na sua mão.",
        color: "text-f9-magenta",
        bg: "bg-f9-magenta/10",
        border: "border-f9-magenta/20",
    },
    {
        icon: Palette,
        title: "IA e Arte Pronta",
        description: "Crie designs únicos com nossa ferramenta de IA ou envie sua arte pronta. Suporte a diversos formatos e especificações técnicas.",
        color: "text-f9-yellow",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
    },
    {
        icon: Headphones,
        title: "Suporte Humanizado",
        description: "Dúvidas antes ou depois do pedido? Nossa equipe está pronta para ajudar por WhatsApp, e-mail ou telefone. Atendimento em Cruzeiro e região.",
        color: "text-f9-blue",
        bg: "bg-f9-blue/10",
        border: "border-f9-blue/20",
    },
    {
        icon: Award,
        title: "Experiência em Comunicação Visual",
        description: "Anos de mercado em rótulos, adesivos, banners e sinalização. Conte com quem entende do começo ao fim do seu projeto.",
        color: "text-f9-navy",
        bg: "bg-f9-navy/10",
        border: "border-f9-navy/20",
    },
];

export default function DiferenciaisPage() {
    return (
        <main className="min-h-screen bg-background selection:bg-f9-cyan selection:text-f9-navy">
            <Header />

            <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 bg-gradient-to-br from-f9-navy via-indigo-950 to-f9-navy text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-f9-cyan/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-f9-magenta/10 rounded-full blur-[100px]" />
                <div className="container relative z-10 mx-auto px-4 text-center">
                    <p className="text-f9-cyan font-bold uppercase tracking-widest text-sm mb-4">
                        Por que a F9?
                    </p>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6">
                        Nossos Diferenciais
                    </h1>
                    <p className="text-lg md:text-xl text-white/85 max-w-2xl mx-auto leading-relaxed">
                        Tecnologia, qualidade e atendimento em cada etapa — do seu briefing até a entrega na sua porta.
                    </p>
                </div>
            </section>

            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {differentials.map((item) => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={item.title}
                                    className={`group relative rounded-2xl border-2 ${item.border} ${item.bg} p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
                                >
                                    <div
                                        className={`inline-flex h-14 w-14 items-center justify-center rounded-xl ${item.bg} ${item.color} mb-6 ring-2 ring-white/50`}
                                    >
                                        <Icon className="h-7 w-7" strokeWidth={2} />
                                    </div>
                                    <h2 className="text-xl font-black text-f9-navy mb-3">
                                        {item.title}
                                    </h2>
                                    <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                                        {item.description}
                                    </p>
                                    <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-f9-navy opacity-0 group-hover:opacity-100 transition-opacity">
                                        <CheckCircle2 className={`h-4 w-4 ${item.color}`} />
                                        <span>F9 garante</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-2xl md:text-3xl font-black text-f9-navy mb-4">
                            Pronto para começar?
                        </h2>
                        <p className="text-gray-600 mb-8">
                            Configure seu produto online em poucos passos ou fale com a gente para um orçamento personalizado.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/#configurator"
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-f9-green text-white font-bold px-8 py-4 shadow-[0_0_20px_rgba(74,222,128,0.4)] hover:bg-emerald-600 transition-colors"
                            >
                                Configurar produto
                            </Link>
                            <a
                                href="https://wa.me/5512991169431?text=Quero%20fazer%20um%20or%C3%A7amento"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-f9-navy text-f9-navy font-bold px-8 py-4 hover:bg-f9-navy hover:text-white transition-colors"
                            >
                                Falar no WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
