"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useConfiguratorStore } from "@/store/configurator-store";
import { useCartStore } from "@/store/cart-store";
import { useCartDrawerStore } from "@/store/cart-drawer-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ProductFormat } from "@/store/configurator-store";
import { buildCartItemLabel, type CartItem } from "@/lib/cart-types";

const formatLabels: Record<ProductFormat, string> = {
    square: "Quadrado",
    rectangular: "Retangular",
    circle: "Redondo",
    oval: "Oval",
    special: "Especial",
};

const materialLabels: Record<string, string> = {
    vinyl_white: "Vinil Branco",
    vinyl_transparent: "Vinil Transparente",
    bopp: "BOPP Metalizado",
    paper_couche: "Papel Couché",
};

const finishLabels: Record<string, string> = {
    gloss: "Brilho",
    matte: "Fosco",
};

const productLabels: Record<string, string> = {
    rotulo: "Rótulos",
    banner: "Banners",
    faixa: "Faixas",
    adesivo: "Adesivo de Recorte",
    outros: "Outros Produtos",
};

function getCutClipPath(format: ProductFormat, cutAreaScale: number): string {
    const s = cutAreaScale;
    const half = (1 - s) * 50;
    switch (format) {
        case "circle":
        case "oval":
            return `ellipse(${50 * s}% ${50 * s}% at 50% 50%)`;
        case "square":
        case "rectangular":
            return `inset(${half}% round 0)`;
        default:
            return `inset(${half}% round 8px)`;
    }
}

function getCutAreaClass(format: ProductFormat): string {
    switch (format) {
        case "circle":
        case "oval":
            return "rounded-[50%]";
        case "square":
        case "rectangular":
            return "rounded-none";
        default:
            return "rounded-lg";
    }
}

export function Step4Summary() {
    const { artwork, specs, totalPrice, selectedProduct, creationMethod, setStep, reset, setCheckoutFromCart } = useConfiguratorStore();
    const addItem = useCartStore((s) => s.addItem);
    const setItems = useCartStore((s) => s.setItems);
    const cartItemsCount = useCartStore((s) => s.items.length);
    const openDrawer = useCartDrawerStore((s) => s.openDrawer);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [showIrParaPagamentoModal, setShowIrParaPagamentoModal] = useState(false);

    const cutAreaScale = Math.min(1, Math.max(0.5, artwork.cutAreaScale ?? 1));
    const aspectPercent = (specs.height / specs.width) * 100;
    const approvalScale = artwork.approvalScale ?? 1;
    const offsetX = artwork.approvalOffsetX ?? 0;
    const offsetY = artwork.approvalOffsetY ?? 0;
    // Recorte: mesma área que na aprovação (centro = cutAreaScale do box)
    const cutClipPath = getCutClipPath(specs.format, cutAreaScale);

    useEffect(() => {
        if (creationMethod === "upload" && artwork.uploadedFile) {
            const url = URL.createObjectURL(artwork.uploadedFile);
            queueMicrotask(() => setPreviewUrl(url));
            return () => URL.revokeObjectURL(url);
        }
        if (creationMethod === "ai" && artwork.selectedDesignUrl) {
            queueMicrotask(() => setPreviewUrl(artwork.selectedDesignUrl));
            return () => {};
        }
        queueMicrotask(() => setPreviewUrl(null));
    }, [creationMethod, artwork.uploadedFile, artwork.selectedDesignUrl]);

    const productLabel = selectedProduct ? productLabels[selectedProduct] ?? "Produto" : "Produto";

    const isSpecialFormat = specs.format === "special";

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
                <h3 className="text-xl font-bold text-f9-navy">Confira seu pedido</h3>
                <p className="text-sm text-gray-500 mt-1">
                    {isSpecialFormat ? "Resumo da compra e valor." : "Arte final já cortada e resumo da compra."}
                </p>
                <p className="text-sm text-gray-600 mt-2 rounded-lg bg-gray-100 px-3 py-2">
                    Produção em até 48h úteis. O prazo de entrega começa após a postagem.
                </p>
            </div>

            {/* Corte especial: só imagem para confirmação. Outros formatos: arte final cortada */}
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <h4 className="font-bold text-f9-navy">
                        {isSpecialFormat ? "Imagem enviada" : "Arte final (já cortada)"}
                    </h4>
                    <p className="text-sm text-gray-500">
                        {isSpecialFormat
                            ? "Confira se é a imagem correta que você enviou."
                            : `Área selecionada na aprovação, no tamanho da mídia (${specs.width} × ${specs.height} mm).`}
                    </p>
                    <div className="flex flex-col items-center gap-4">
                        <div
                            className="mx-auto w-full rounded-lg overflow-hidden bg-gray-50"
                            style={{ maxWidth: 420 }}
                        >
                            {isSpecialFormat ? (
                                <div
                                    className="relative w-full"
                                    style={{ height: 0, paddingBottom: "75%" }}
                                >
                                    {previewUrl ? (
                                        <Image
                                            src={previewUrl}
                                            alt="Imagem enviada"
                                            fill
                                            className="object-contain select-none"
                                            sizes="(max-width: 420px) 100vw, 420px"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                                            Nenhuma imagem para exibir.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div
                                    className={cn(
                                        "relative overflow-hidden bg-white border-2 border-dashed border-f9-blue shadow-inner block",
                                        getCutAreaClass(specs.format)
                                    )}
                                    style={{
                                        width: "100%",
                                        maxWidth: 420,
                                        height: 0,
                                        paddingBottom: `${aspectPercent}%`,
                                    }}
                                >
                                    {previewUrl ? (
                                        <>
                                            <div
                                                className="absolute inset-0"
                                                style={{
                                                    transform: `scale(${1 / cutAreaScale})`,
                                                    transformOrigin: "center center",
                                                }}
                                            >
                                                <div
                                                    className={cn(
                                                        "absolute inset-0 overflow-hidden",
                                                        getCutAreaClass(specs.format)
                                                    )}
                                                    style={{
                                                        clipPath: cutClipPath,
                                                        WebkitClipPath: cutClipPath,
                                                    }}
                                                >
                                                    <Image
                                                        src={previewUrl}
                                                        alt="Arte final"
                                                        fill
                                                        className="object-contain select-none"
                                                        sizes="(max-width: 420px) 100vw, 420px"
                                                        unoptimized
                                                        style={{
                                                            transform: `scale(${approvalScale}) translate(${offsetX}%, ${offsetY}%)`,
                                                            transformOrigin: "center center",
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm bg-gray-50">
                                            Nenhuma arte para exibir.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        {!isSpecialFormat && (
                            <p className="text-xs text-gray-400">
                                Proporção {specs.width} × {specs.height} mm. Em tamanho real, o produto terá essas dimensões.
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Resumo da compra e valor */}
            <Card className="border-f9-blue/20 bg-slate-50/50">
                <CardContent className="pt-6 space-y-4">
                    <h4 className="font-bold text-f9-navy">Resumo da compra</h4>
                    <dl className="space-y-2 text-sm">
                        <div className="flex justify-between gap-4">
                            <dt className="text-gray-600">Produto</dt>
                            <dd className="font-medium text-right">{productLabel}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-gray-600">Formato</dt>
                            <dd className="font-medium text-right">{formatLabels[specs.format]}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-gray-600">Dimensões</dt>
                            <dd className="font-medium text-right">{specs.width} × {specs.height} mm</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-gray-600">Quantidade</dt>
                            <dd className="font-medium text-right">{specs.quantity} un.</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-gray-600">Material</dt>
                            <dd className="font-medium text-right">{materialLabels[specs.material] ?? specs.material}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-gray-600">Acabamento</dt>
                            <dd className="font-medium text-right">{finishLabels[specs.finish] ?? specs.finish}</dd>
                        </div>
                    </dl>
                    <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                        <span className="text-base font-bold text-f9-navy">Total</span>
                        <span className="text-2xl font-bold text-f9-blue">
                            R$ {typeof totalPrice === "number" ? totalPrice.toFixed(2).replace(".", ",") : "0,00"}
                        </span>
                    </div>
                    <div className="pt-4 flex flex-col sm:flex-row gap-3">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={async () => {
                                if (!selectedProduct) return;
                                const payload = {
                                    product_type: selectedProduct,
                                    product_label: buildCartItemLabel(selectedProduct, specs),
                                    specs: { ...specs },
                                    artwork: {
                                        presentationType: artwork.presentationType,
                                        selectedDesignUrl: artwork.selectedDesignUrl,
                                        enhancedDesignUrl: artwork.enhancedDesignUrl,
                                        approvalScale: artwork.approvalScale ?? 1,
                                        cutAreaScale: artwork.cutAreaScale ?? 1,
                                    },
                                    unit_price: totalPrice,
                                    quantity: 1,
                                };
                                addItem(payload);
                                try {
                                    const res = await fetch("/api/cart/items", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify(payload),
                                    });
                                    if (res.ok) {
                                        const cartRes = await fetch("/api/cart");
                                        const data = (await cartRes.json()) as { items?: CartItem[] };
                                        if (data?.items) setItems(data.items);
                                    }
                                } catch {
                                    // mantém item no store (local)
                                }
                                openDrawer();
                                reset();
                            }}
                        >
                            Adicionar ao carrinho
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={() => {
                                if (cartItemsCount > 0) {
                                    setShowIrParaPagamentoModal(true);
                                } else {
                                    setStep(7);
                                }
                            }}
                        >
                            Ir para o pagamento
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Modal: carrinho com itens → pagar só este ou incluir tudo */}
            <Dialog open={showIrParaPagamentoModal} onOpenChange={setShowIrParaPagamentoModal}>
                <DialogContent className="w-[calc(100%-2rem)] max-w-[480px] gap-0 overflow-hidden">
                    <DialogHeader className="pb-2 min-w-0">
                        <DialogTitle className="break-words">Você já tem itens no carrinho</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-slate-600 pb-6 pt-1 leading-relaxed break-words min-w-0">
                        Deseja pagar somente este item agora ou incluir os itens do carrinho no pagamento?
                    </p>
                    <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 mt-0 min-w-0 flex-wrap">
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto sm:min-w-[140px] shrink-0"
                            onClick={() => {
                                setShowIrParaPagamentoModal(false);
                                setStep(7);
                            }}
                        >
                            Pagar somente este item
                        </Button>
                        <Button
                            className="w-full sm:w-auto sm:min-w-[180px] shrink-0"
                            onClick={async () => {
                                if (!selectedProduct) return;
                                const payload = {
                                    product_type: selectedProduct,
                                    product_label: buildCartItemLabel(selectedProduct, specs),
                                    specs: { ...specs },
                                    artwork: {
                                        presentationType: artwork.presentationType,
                                        selectedDesignUrl: artwork.selectedDesignUrl,
                                        enhancedDesignUrl: artwork.enhancedDesignUrl,
                                        approvalScale: artwork.approvalScale ?? 1,
                                        cutAreaScale: artwork.cutAreaScale ?? 1,
                                    },
                                    unit_price: totalPrice,
                                    quantity: 1,
                                };
                                addItem(payload);
                                try {
                                    const res = await fetch("/api/cart/items", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify(payload),
                                    });
                                    if (res.ok) {
                                        const cartRes = await fetch("/api/cart");
                                        const data = (await cartRes.json()) as { items?: CartItem[] };
                                        if (data?.items) setItems(data.items);
                                    }
                                } catch {
                                    // mantém item no store (local)
                                }
                                setShowIrParaPagamentoModal(false);
                                setCheckoutFromCart(true);
                                setStep(7);
                            }}
                        >
                            Incluir no carrinho e pagar tudo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Mensagem exclusiva do corte especial: após o pagamento um profissional entra em contato */}
            {isSpecialFormat && (
                <Card className="border-f9-blue/30 bg-f9-blue/5">
                    <CardContent className="pt-6">
                        <p className="text-sm font-medium text-f9-navy text-center">
                            Assim que aprovarmos o pagamento, um especialista irá entrar em contato.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
