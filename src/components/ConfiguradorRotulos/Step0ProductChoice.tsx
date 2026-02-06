"use client";

import { useConfiguratorStore, ProductType } from "@/store/configurator-store";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Tag, Megaphone, RectangleHorizontal, Sticker, Package } from "lucide-react";

const products: { id: ProductType; label: string; shortLabel: string; icon: React.ReactNode }[] = [
    { id: "rotulo", label: "Rótulos & Embalagens", shortLabel: "Rótulos", icon: <Tag className="w-8 h-8" /> },
    { id: "banner", label: "Banners & Faixas", shortLabel: "Banners", icon: <Megaphone className="w-8 h-8" /> },
    { id: "faixa", label: "Faixas Promocionais", shortLabel: "Faixas", icon: <RectangleHorizontal className="w-8 h-8" /> },
    { id: "adesivo", label: "Adesivos & Recorte", shortLabel: "Adesivos", icon: <Sticker className="w-8 h-8" /> },
    { id: "outros", label: "Outros Produtos", shortLabel: "Outros", icon: <Package className="w-8 h-8" /> },
];

export function Step0ProductChoice() {
    const { selectedProduct, setSelectedProduct, setStep } = useConfiguratorStore();

    const handleSelectProduct = (productId: ProductType) => {
        setSelectedProduct(productId);
        setStep(2); // Avança direto para "Como criar"
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-2">
                <h3 className="text-xl font-bold text-f9-navy">O que você quer produzir?</h3>
                <p className="text-gray-500 text-sm">
                    Escolha o tipo de produto. Assim personalizamos as opções e o orçamento para você.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p) => (
                    <Card
                        key={p.id}
                        className={cn(
                            "cursor-pointer flex flex-col items-center justify-center p-6 gap-3 transition-all border-2 hover:border-f9-blue",
                            selectedProduct === p.id ? "border-blue-600 bg-blue-50 text-blue-800 [&_svg]:stroke-blue-700" : "border-gray-300 bg-white text-gray-900"
                        )}
                        onClick={() => handleSelectProduct(p.id)}
                    >
                        {p.icon}
                        <span className="text-sm font-semibold text-center">{p.label}</span>
                    </Card>
                ))}
            </div>
        </div>
    );
}
