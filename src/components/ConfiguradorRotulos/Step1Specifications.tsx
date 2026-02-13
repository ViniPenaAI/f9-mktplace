"use client";

import { useConfiguratorStore, ProductFormat, Material, Finish } from "@/store/configurator-store";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Square, Circle, RectangleHorizontal, Moon, Star } from "lucide-react";

const productFormatLabel: Record<string, string> = {
    rotulo: "Rótulo",
    banner: "Banner",
    faixa: "Faixa",
    adesivo: "Adesivo",
    outros: "Produto",
};

export function Step1Specifications() {
    const { specs, updateSpecs, selectedProduct } = useConfiguratorStore();
    const formatLabel = selectedProduct ? productFormatLabel[selectedProduct] ?? "Produto" : "Rótulo";

    const formats: { id: ProductFormat; label: string; icon: React.ReactNode }[] = [
        { id: 'square', label: 'Quadrado', icon: <Square className="w-8 h-8" /> },
        { id: 'rectangular', label: 'Retangular', icon: <RectangleHorizontal className="w-8 h-8" /> },
        { id: 'circle', label: 'Redondo', icon: <Circle className="w-8 h-8" /> },
        { id: 'oval', label: 'Oval', icon: <div className="w-8 h-6 border-2 border-current rounded-full" /> },
        { id: 'special', label: 'Especial', icon: <Star className="w-8 h-8" /> },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-f9-navy">1. Formato do {formatLabel}</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {formats.map((fmt) => (
                        <Card
                            key={fmt.id}
                            className={cn(
                                "cursor-pointer flex flex-col items-center justify-center p-4 gap-2 transition-all border-2 hover:border-f9-blue",
                                specs.format === fmt.id
                                    ? "border-blue-600 bg-blue-50 text-blue-800 [&_svg]:stroke-blue-700"
                                    : "border-gray-300 bg-white text-gray-900"
                            )}
                            onClick={() => {
                                if (fmt.id === "rectangular") updateSpecs({ format: fmt.id, width: 80, height: 50 });
                                else if (fmt.id === "oval") updateSpecs({ format: fmt.id, width: 80, height: 50 });
                                else if (fmt.id === "square" || fmt.id === "circle") updateSpecs({ format: fmt.id, width: 50, height: 50 });
                                else updateSpecs({ format: fmt.id });
                            }}
                        >
                            {fmt.icon}
                            <span className="text-sm font-medium">{fmt.label}</span>
                        </Card>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <Label>Dimensões (mm)</Label>
                    <div className="flex gap-4">
                        <div className="space-y-2 flex-1">
                            <Label htmlFor="width" className="text-xs text-gray-500">Largura</Label>
                            <Input
                                id="width"
                                type="number"
                                value={specs.width}
                                onChange={(e) => updateSpecs({ width: Number(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-2 flex-1">
                            <Label htmlFor="height" className="text-xs text-gray-500">Altura</Label>
                            <Input
                                id="height"
                                type="number"
                                value={specs.height}
                                onChange={(e) => updateSpecs({ height: Number(e.target.value) })}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <Label>Material e Acabamento</Label>
                    <div className="space-y-2">
                        <Select
                            value={specs.material}
                            onValueChange={(v) => updateSpecs({ material: v as Material })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o Material" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="vinyl_white">Vinil Branco (Mais Popular)</SelectItem>
                                <SelectItem value="vinyl_transparent">Vinil Transparente</SelectItem>
                                <SelectItem value="bopp">BOPP Metalizado</SelectItem>
                                <SelectItem value="paper_couche">Papel Couché</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex gap-2 pt-2">
                            {(['gloss', 'matte'] as Finish[]).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => updateSpecs({ finish: f })}
                                    className={cn(
                                        "flex-1 py-2 px-4 rounded-md text-sm border transition-all",
                                        specs.finish === f
                                            ? "bg-f9-navy text-white border-f9-navy"
                                            : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                                    )}
                                >
                                    {f === 'gloss' ? 'Brilho' : 'Fosco'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                    <Label>Quantidade</Label>
                    <span className="text-2xl font-bold text-f9-blue">{specs.quantity} un.</span>
                </div>
                <Slider
                    value={[specs.quantity]}
                    onValueChange={(vals) => updateSpecs({ quantity: vals[0] })}
                    min={50}
                    max={5000}
                    step={50}
                    className="py-4"
                />
                <div className="flex justify-between text-xs text-gray-400">
                    <span>50 un.</span>
                    <span>5000 un.</span>
                </div>
            </div>
        </div>
    );
}
