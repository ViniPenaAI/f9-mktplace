import { Star, ShieldCheck, Truck, Zap } from "lucide-react";

export function SocialProof() {
    const testimonials = [
        {
            name: "Ana Silva",
            role: "Empresária - Cervejaria Artesanal",
            text: "A F9 transformou a cara da minha marca. Os rótulos ficaram incríveis e a ferramenta de IA me deu ideias que eu nunca teria pensado sozinha.",
            stars: 5,
        },
        {
            name: "Carlos Souza",
            role: "Marketing - Burger King (Franquia)",
            text: "Agilidade impressionante. Configurei, aprovei e em poucos dias os adesivos estavam na loja. Qualidade de impressão impecável.",
            stars: 5,
        },
        {
            name: "Mariana Oliveira",
            role: "Designer Gráfico",
            text: "Como designer, sou chata com qualidade. A calibração de cores da F9 é perfeita, o CMYK bateu exatamente com meu arquivo.",
            stars: 5,
        },
    ];

    return (
        <section className="py-20 bg-white">
            <div className="container mx-auto px-4 space-y-20">

                {/* Trust Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-f9-blue/20 transition-colors">
                        <div className="w-12 h-12 bg-f9-blue/10 rounded-full flex items-center justify-center text-f9-blue mb-4">
                            <Zap className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-f9-navy mb-2">Produção Express</h3>
                        <p className="text-gray-500 text-sm">Produção automatizada que garante envio em até 48h após aprovação.</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-f9-green/20 transition-colors">
                        <div className="w-12 h-12 bg-f9-green/10 rounded-full flex items-center justify-center text-f9-green mb-4">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-f9-navy mb-2">Qualidade Garantida</h3>
                        <p className="text-gray-500 text-sm">Se não ficar satisfeito com a impressão, reimprimimos seu material.</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-f9-magenta/20 transition-colors">
                        <div className="w-12 h-12 bg-f9-magenta/10 rounded-full flex items-center justify-center text-f9-magenta mb-4">
                            <Truck className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-f9-navy mb-2">Entrega para todo Brasil</h3>
                        <p className="text-gray-500 text-sm">Parceria com as melhores transportadoras para chegar onde você estiver.</p>
                    </div>
                </div>

                {/* Testimonials */}
                <div className="space-y-10">
                    <div className="text-center space-y-4">
                        <h2 className="text-3xl font-black text-f9-navy">Quem usa, recomenda</h2>
                        <div className="flex items-center justify-center gap-2">
                            <div className="flex text-f9-yellow">
                                {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-5 h-5 fill-current" />)}
                            </div>
                            <span className="font-bold text-gray-700">4.9/5</span>
                            <span className="text-gray-400 text-sm">(+500 avaliações)</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {testimonials.map((t, i) => (
                            <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="flex text-f9-yellow mb-4">
                                    {[...Array(t.stars)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                                </div>
                                <p className="text-gray-600 italic mb-6">"{t.text}"</p>
                                <div>
                                    <p className="font-bold text-f9-navy">{t.name}</p>
                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{t.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
}
