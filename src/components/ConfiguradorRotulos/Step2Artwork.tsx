"use client";

import { useState, useRef, useEffect } from "react";
import { useConfiguratorStore } from "@/store/configurator-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Sparkles, MessageCircle, RefreshCw, Wand2, Image as ImageIcon, FileImage, Square, Circle, RectangleHorizontal, Star, Layers, Package, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductFormat, PresentationType, Finish } from "@/store/configurator-store";

// Número WhatsApp (troque pelo número real da empresa, ex: 5511999999999)
const WHATSAPP_NUMBER = "5511999999999";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

const formats: { id: ProductFormat; label: string; icon: React.ReactNode }[] = [
    { id: "square", label: "Quadrado", icon: <Square className="w-6 h-6" /> },
    { id: "rectangular", label: "Retangular", icon: <RectangleHorizontal className="w-6 h-6" /> },
    { id: "circle", label: "Redondo", icon: <Circle className="w-6 h-6" /> },
    { id: "oval", label: "Oval", icon: <div className="w-6 h-5 border-2 border-current rounded-full" /> },
    { id: "special", label: "Especial", icon: <Star className="w-6 h-6" /> },
];

type SizePreset = { id: string; label: string; widthMm: number; heightMm: number };

const sizePresetsByFormat: Record<ProductFormat, SizePreset[]> = {
    square: [
        { id: "3x3", label: "3 x 3 cm", widthMm: 30, heightMm: 30 },
        { id: "5x5", label: "5 x 5 cm", widthMm: 50, heightMm: 50 },
        { id: "10x10", label: "10 x 10 cm", widthMm: 100, heightMm: 100 },
    ],
    rectangular: [
        { id: "5x10", label: "5 x 10 cm", widthMm: 50, heightMm: 100 },
        { id: "8x5", label: "8 x 5 cm", widthMm: 80, heightMm: 50 },
        { id: "10x15", label: "10 x 15 cm", widthMm: 100, heightMm: 150 },
        { id: "20x10", label: "20 x 10 cm", widthMm: 200, heightMm: 100 },
    ],
    circle: [
        { id: "5", label: "5 cm (diâmetro)", widthMm: 50, heightMm: 50 },
        { id: "10", label: "10 cm (diâmetro)", widthMm: 100, heightMm: 100 },
        { id: "15", label: "15 cm (diâmetro)", widthMm: 150, heightMm: 150 },
    ],
    oval: [
        { id: "8x5", label: "8 x 5 cm", widthMm: 80, heightMm: 50 },
        { id: "10x6", label: "10 x 6 cm", widthMm: 100, heightMm: 60 },
        { id: "12x8", label: "12 x 8 cm", widthMm: 120, heightMm: 80 },
    ],
    special: [
        { id: "5x10", label: "5 x 10 cm", widthMm: 50, heightMm: 100 },
        { id: "10x10", label: "10 x 10 cm", widthMm: 100, heightMm: 100 },
        { id: "10x15", label: "10 x 15 cm", widthMm: 100, heightMm: 150 },
    ],
};

export function Step2Artwork() {
    const { artwork, updateArtwork, specs, updateSpecs, creationMethod, selectedProduct } = useConfiguratorStore();
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiPrompt, setAiPrompt] = useState(artwork.aiPrompt || "");
    const [brandName, setBrandName] = useState("");
    const [aiIngredients, setAiIngredients] = useState(artwork.aiIngredients || "");
    const [aiLogoFile, setAiLogoFile] = useState<File | null>(artwork.aiLogoFile || null);
    const [uploadedFile, setUploadedFile] = useState<File | null>(artwork.uploadedFile || null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadInputRef = useRef<HTMLInputElement>(null);
    const cutLineInputRef = useRef<HTMLInputElement>(null);

    const getMaskStyle = () => {
        switch (specs.format) {
            case "circle": return "rounded-full";
            case "oval": return "rounded-[50%]";
            case "square": return "rounded-none";
            case "rectangular": return "rounded-none";
            default: return "rounded-lg";
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            setAiLogoFile(file);
            updateArtwork({ aiLogoFile: file });
        }
    };

    const handleArtworkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            setUploadedFile(file);
            updateArtwork({ uploadedFile: file, method: "upload" });
        }
    };

    const handleCutLineUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            updateArtwork({ cutLineFile: e.target.files[0] });
        }
    };

    const handleGenerateAI = async () => {
        if (!aiPrompt) return;
        setIsGenerating(true);
        await new Promise((r) => setTimeout(r, 3500));
        const mockedDesigns = [
            "https://images.unsplash.com/photo-1625842268584-8f3296236761?q=80&w=2070&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1606787366850-de6330128bfc?q=80&w=2070&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1595079676339-1534827d5c3c?q=80&w=2070&auto=format&fit=crop",
        ];
        updateArtwork({
            generatedDesigns: mockedDesigns,
            method: "ai",
            aiPrompt,
            aiIngredients,
        });
        setIsGenerating(false);
    };

    const handleSelectDesign = (url: string) => {
        updateArtwork({ selectedDesignUrl: url });
    };

    // Sem método escolhido (não deveria acontecer se o fluxo estiver correto)
    if (!creationMethod) {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <h3 className="text-xl font-bold text-f9-navy">Arte & IA</h3>
                <p className="text-gray-500">Volte à etapa anterior e escolha como deseja criar sua arte (upload, IA ou especialista).</p>
            </div>
        );
    }

    // Garante que a quantidade mínima cubra pelo menos 1m² de adesivo,
    // considerando área de impressão + sangria (bordas) sem quebrar a ordem de hooks.
    useEffect(() => {
        if (creationMethod !== "upload") return;
        const bleedMm = 3; // sangria em cada lado
        const effWidth = specs.width > 0 ? specs.width + 2 * bleedMm : 0;
        const effHeight = specs.height > 0 ? specs.height + 2 * bleedMm : 0;
        const areaMm2 = effWidth * effHeight;
        if (!areaMm2) return;
        const min = Math.max(1, Math.ceil(1_000_000 / areaMm2));
        if (specs.quantity < min) {
            updateSpecs({ quantity: min });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [creationMethod, specs.width, specs.height, specs.quantity]);

    // —— Caminho 1: Já tenho minha arte (Upload) ——
    if (creationMethod === "upload") {

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-f9-navy">Envie sua arte</h3>
                    <p className="text-sm text-gray-500">Envie o arquivo finalizado. Recomendamos PDF, AI, PSD ou CDR. Em seguida, ajuste tamanho, formato e como deseja receber.</p>
                </div>

                {/* Upload da arte */}
                <Card>
                    <CardContent className="pt-6 px-4 sm:px-6">
                        <div
                            className="flex flex-col items-center justify-center min-h-[220px] border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer px-5 py-6 sm:px-8 sm:py-8"
                            onClick={() => uploadInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                ref={uploadInputRef}
                                className="hidden"
                                accept=".pdf,.ai,.psd,.cdr,image/*"
                                onChange={handleArtworkUpload}
                            />
                            {uploadedFile ? (
                                <div className="flex flex-col items-center gap-2 text-green-600 px-2">
                                    <FileImage className="w-14 h-14" />
                                    <span className="font-medium truncate max-w-[260px]">{uploadedFile.name}</span>
                                    <span className="text-xs text-gray-500">Clique para trocar o arquivo</span>
                                </div>
                            ) : (
                                <>
                                    <Upload className="w-12 h-12 text-gray-300 mb-4 shrink-0" />
                                    <h4 className="text-base sm:text-lg font-bold text-gray-700 mb-2 text-center px-2">Arraste seu arquivo aqui ou clique para selecionar</h4>
                                    <p className="text-sm text-gray-500 text-center px-2">PDF, PNG, JPG, AI, PSD (máx. 50MB)</p>
                                    <Button type="button" variant="outline" className="mt-4" onClick={(e) => { e.stopPropagation(); uploadInputRef.current?.click(); }}>
                                        Selecionar arquivo finalizado
                                    </Button>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Ajustes: formato, tamanho, quantidade, material, acabamento, recorte (se adesivo), apresentação — só após ter arte */}
                {uploadedFile && (
                    <Card>
                        <CardContent className="pt-6 space-y-6">
                            <h4 className="text-lg font-bold text-f9-navy">Ajustes e configuração</h4>

                            {/* Formatos */}
                            <div className="space-y-2">
                                <Label>Formato</Label>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                    {formats.map((fmt) => (
                                        <Card
                                            key={fmt.id}
                                            className={cn(
                                                "cursor-pointer flex flex-col items-center justify-center p-3 gap-1 transition-all border-2 hover:border-f9-blue",
                                                specs.format === fmt.id
                                                    ? "border-blue-600 bg-blue-50 text-blue-800 [&_svg]:stroke-blue-700"
                                                    : "border-gray-300 bg-white text-gray-900"
                                            )}
                                            onClick={() => {
                                                const presets = sizePresetsByFormat[fmt.id];
                                                const first = presets[0];
                                                if (first) updateSpecs({ format: fmt.id, width: first.widthMm, height: first.heightMm });
                                                else updateSpecs({ format: fmt.id });
                                            }}
                                        >
                                            {fmt.icon}
                                            <span className="text-xs font-medium">{fmt.label}</span>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            {/* Tamanho em cm (presets + manual) */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>Tamanho (cm)</Label>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {sizePresetsByFormat[specs.format].map((preset) => {
                                        const isActive = specs.width === preset.widthMm && specs.height === preset.heightMm;
                                        return (
                                            <button
                                                key={preset.id}
                                                type="button"
                                                onClick={() => updateSpecs({ width: preset.widthMm, height: preset.heightMm })}
                                                className={cn(
                                                    "text-xs sm:text-sm px-3 py-2 rounded-lg border transition-all font-semibold",
                                                    isActive
                                                        ? "border-f9-blue bg-blue-50 text-f9-blue shadow-sm"
                                                        : "border-gray-300 bg-white text-gray-700 hover:border-f9-blue/70"
                                                )}
                                            >
                                                {preset.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="space-y-2">
                                    <span className="text-xs text-gray-500">Ou informe manualmente:</span>
                                    <div className="flex gap-4">
                                        <div className="flex-1 space-y-1">
                                            <span className="text-xs text-gray-500">Largura (cm)</span>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={specs.width ? specs.width / 10 : ""}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    const mm = isNaN(val) ? 0 : Math.round(val * 10);
                                                    updateSpecs({ width: mm });
                                                }}
                                            />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <span className="text-xs text-gray-500">Altura (cm)</span>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={specs.height ? specs.height / 10 : ""}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    const mm = isNaN(val) ? 0 : Math.round(val * 10);
                                                    updateSpecs({ height: mm });
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quantidade — mínimo para cobrir 1m² */}
                            <div className="space-y-2">
                                {(() => {
                                    const bleedMm = 3;
                                    const effWidth = specs.width > 0 ? specs.width + 2 * bleedMm : 0;
                                    const effHeight = specs.height > 0 ? specs.height + 2 * bleedMm : 0;
                                    const areaMm2 = effWidth * effHeight;
                                    const minQty = areaMm2 > 0 ? Math.max(1, Math.ceil(1_000_000 / areaMm2)) : 1;
                                    const maxQty = minQty * 10;
                                    const safeQty = specs.quantity < minQty ? minQty : specs.quantity;

                                    return (
                                        <>
                                            <Label>Quantidade</Label>
                                            <div className="space-y-3">
                                                <div className="flex-1">
                                                    <Slider
                                                        min={minQty}
                                                        max={maxQty}
                                                        step={minQty}
                                                        value={[safeQty]}
                                                        onValueChange={([val]) => {
                                                            const next = !val || val < minQty ? minQty : val;
                                                            updateSpecs({ quantity: next });
                                                        }}
                                                    />
                                                </div>
                                                <div className="flex gap-3 items-center flex-wrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <Input
                                                            type="number"
                                                            min={minQty}
                                                            className="w-32"
                                                            value={safeQty}
                                                            onChange={(e) => {
                                                                const raw = Number(e.target.value) || 0;
                                                                const next = raw < minQty ? minQty : raw;
                                                                updateSpecs({ quantity: next });
                                                            }}
                                                        />
                                                        <span className="text-sm text-gray-600">un.</span>
                                                    </div>
                                                    <span className="text-xs text-gray-500">
                                                        Pedido mínimo 1m², aproximadamente {minQty} un.
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>

                            {/* Material (fixo por enquanto) */}
                            <div className="space-y-1">
                                <Label>Material</Label>
                                <p className="text-sm text-gray-700 font-medium">Adesivo Vinil (Vinil Branco)</p>
                            </div>

                            {/* Acabamento: brilho ou fosco */}
                            <div className="space-y-2">
                                <Label>Acabamento</Label>
                                <div className="flex gap-2">
                                    {(["gloss", "matte"] as Finish[]).map((f) => (
                                        <button
                                            key={f}
                                            type="button"
                                            onClick={() => updateSpecs({ finish: f })}
                                            className={cn(
                                                "flex-1 py-2 px-4 rounded-md text-sm border transition-all",
                                                specs.finish === f
                                                    ? "border-f9-blue bg-blue-50 text-f9-blue"
                                                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                                            )}
                                        >
                                            {f === "gloss" ? "Brilho" : "Fosco"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Adesivo de recorte: linhas de corte */}
                            {selectedProduct === "adesivo" && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="isDieCut"
                                            checked={artwork.isDieCut}
                                            onChange={(e) => updateArtwork({ isDieCut: e.target.checked })}
                                            className="rounded border-gray-300"
                                        />
                                        <Label htmlFor="isDieCut" className="cursor-pointer">É adesivo de recorte? (precisa enviar arquivo de linhas de corte)</Label>
                                    </div>
                                    {artwork.isDieCut && (
                                        <div
                                            className="border-2 border-dashed border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
                                            onClick={() => cutLineInputRef.current?.click()}
                                        >
                                            <input
                                                type="file"
                                                ref={cutLineInputRef}
                                                className="hidden"
                                                accept=".pdf,.ai,.eps,.dxf,.cdr"
                                                onChange={handleCutLineUpload}
                                            />
                                            {artwork.cutLineFile ? (
                                                <span className="text-sm font-medium text-green-600 truncate max-w-[220px]">{artwork.cutLineFile.name}</span>
                                            ) : (
                                                <>
                                                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                                    <span className="text-sm text-gray-500">Envie o arquivo de linhas de corte (vetor: PDF, AI, EPS, DXF, CDR)</span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Apresentação: cartela ou unidades */}
                            <div className="space-y-2">
                                <Label>Como deseja receber o produto?</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <Card
                                        className={cn(
                                            "cursor-pointer flex flex-col items-center justify-center p-4 gap-2 transition-all border-2 hover:border-blue-500",
                                            artwork.presentationType === "cartela"
                                                ? "border-blue-600 bg-blue-50 text-blue-800 [&_span]:text-blue-800 [&_span:last-child]:text-blue-700 [&_svg]:stroke-blue-700"
                                                : "border-gray-300 bg-white text-gray-900"
                                        )}
                                        onClick={() => updateArtwork({ presentationType: "cartela" as PresentationType })}
                                    >
                                        <LayoutGrid className="w-8 h-8" />
                                        <span className="text-sm font-semibold">Cartela</span>
                                        <span className="text-xs text-gray-600 text-center">Vários adesivos em uma folha/cartela</span>
                                    </Card>
                                    <Card
                                        className={cn(
                                            "cursor-pointer flex flex-col items-center justify-center p-4 gap-2 transition-all border-2 hover:border-blue-500",
                                            artwork.presentationType === "unidades"
                                                ? "border-blue-600 bg-blue-50 text-blue-800 [&_span]:text-blue-800 [&_span:last-child]:text-blue-700 [&_svg]:stroke-blue-700"
                                                : "border-gray-300 bg-white text-gray-900"
                                        )}
                                        onClick={() => updateArtwork({ presentationType: "unidades" as PresentationType })}
                                    >
                                        <Layers className="w-8 h-8" />
                                        <span className="text-sm font-semibold">Unidades</span>
                                        <span className="text-xs text-gray-600 text-center">Adesivos individuais soltos</span>
                                    </Card>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        );
    }

    // —— Caminho 2: Criar com IA ——
    if (creationMethod === "ai") {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-f9-navy">Criar com Inteligência Artificial</h3>
                    <p className="text-sm text-gray-500">Descreva sua ideia e nossa IA gera opções exclusivas para você em segundos.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <Card>
                            <CardContent className="pt-6 space-y-4">
                                <div className="space-y-2">
                                    <Label>Nome da Marca</Label>
                                    <Input placeholder="Ex: Cervejaria Artesanal" value={brandName} onChange={(e) => setBrandName(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Sua Logo (opcional)</Label>
                                    <div
                                        className="border-2 border-dashed border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                        {aiLogoFile ? (
                                            <div className="flex items-center gap-2 text-green-600">
                                                <FileImage className="w-6 h-6" />
                                                <span className="text-sm font-medium truncate max-w-[200px]">{aiLogoFile.name}</span>
                                            </div>
                                        ) : (
                                            <div className="text-center text-gray-400">
                                                <Upload className="w-6 h-6 mx-auto mb-1" />
                                                <span className="text-xs">Clique para enviar sua logo</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Estilo desejado</Label>
                                    <Textarea
                                        placeholder="Ex: Rótulo minimalista, fundo preto fosco, letras douradas, estilo premium."
                                        className="h-24 resize-none"
                                        value={aiPrompt}
                                        onChange={(e) => setAiPrompt(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Texto obrigatório / Ingredientes</Label>
                                    <Textarea
                                        placeholder="Ex: Contém glúten. Teor alcoólico 5%. Fabricado por..."
                                        className="h-20 resize-none"
                                        value={aiIngredients}
                                        onChange={(e) => setAiIngredients(e.target.value)}
                                    />
                                </div>
                                <Button
                                    className="w-full bg-gradient-to-r from-f9-blue to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-bold h-12"
                                    onClick={handleGenerateAI}
                                    disabled={isGenerating || !aiPrompt}
                                >
                                    {isGenerating ? (
                                        <><RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Gerando...</>
                                    ) : (
                                        <><Wand2 className="w-5 h-5 mr-2" /> Gerar opções com IA</>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="space-y-4">
                        <Label>Pré-visualização (formato: {specs.format})</Label>
                        {artwork.generatedDesigns.length > 0 ? (
                            <div className="grid grid-cols-1 gap-6">
                                {artwork.generatedDesigns.map((url, idx) => (
                                    <div key={idx} className="flex flex-col items-center gap-2">
                                        <div
                                            className={cn(
                                                "relative group cursor-pointer w-64 h-64 bg-gray-100 shadow-md transition-all hover:shadow-xl",
                                                getMaskStyle(),
                                                artwork.selectedDesignUrl === url ? "ring-4 ring-f9-green scale-105" : "hover:scale-105"
                                            )}
                                            onClick={() => handleSelectDesign(url)}
                                        >
                                            <img src={url} alt={`Design ${idx + 1}`} className={cn("w-full h-full object-cover", getMaskStyle())} />
                                            {artwork.selectedDesignUrl === url && (
                                                <div className="absolute top-2 right-2 bg-f9-green text-white p-1 rounded-full">
                                                    <Sparkles className="w-4 h-4" />
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500">Opção {idx + 1}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="min-h-[400px] border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 p-8 text-center">
                                <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                                <h4 className="font-bold text-gray-600 mb-2">Seus designs aparecerão aqui</h4>
                                <p className="text-sm max-w-xs">Preencha ao lado e clique em gerar para ver opções no formato <strong>{specs.format}</strong>.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // —— Caminho 3: Falar com especialista (WhatsApp) ——
    if (creationMethod === "specialist") {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-f9-navy">Falar com um especialista</h3>
                    <p className="text-sm text-gray-500">Precisa de ajustes ou de uma criação mais elaborada? Nossa equipe de designers está pronta para ajudar.</p>
                </div>
                <Card>
                    <CardContent className="pt-8 pb-8 text-center space-y-6">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                            <MessageCircle className="w-10 h-10" />
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-f9-navy mb-2">Chame no WhatsApp</h4>
                            <p className="text-gray-500 max-w-md mx-auto">
                                Conte o que você precisa. Nossa equipe responde rápido e monta a arte ou o orçamento sob medida para você.
                            </p>
                        </div>
                        <Button
                            className="bg-f9-green hover:bg-green-600 text-white font-bold h-12 px-8 rounded-full"
                            asChild
                        >
                            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                                Chamar no WhatsApp ↗
                            </a>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return null;
}
