import type { ProductType } from "@/store/configurator-store";
import type { ProductSpecs } from "@/store/configurator-store";

const productLabels: Record<string, string> = {
    rotulo: "Rótulo",
    banner: "Banner",
    faixa: "Faixa",
    adesivo: "Adesivo de Recorte",
    outros: "Outros",
};

export function buildCartItemLabel(product_type: ProductType, specs: ProductSpecs): string {
    const base = productLabels[product_type] ?? product_type;
    const w = specs.width / 10;
    const h = specs.height / 10;
    if (product_type === "faixa") return `${base} ${w}×${h} cm`;
    return `${base} ${w}×${h} cm`;
}

/** Quantidade mínima para cobrir 1 m² (área com sangria 3 mm por lado). */
export function getMinQuantityForSize(widthMm: number, heightMm: number): number {
    const bleed = 3;
    const w = widthMm + 2 * bleed;
    const h = heightMm + 2 * bleed;
    const areaMm2 = w * h;
    return areaMm2 > 0 ? Math.max(1, Math.ceil(1_000_000 / areaMm2)) : 1;
}

/** Preço estimado pela mesma regra do configurador (área m² × base + fatores). */
export function calculatePriceForSpecs(specs: ProductSpecs): number {
    const area = (specs.width * specs.height * specs.quantity) / 1_000_000;
    const baseRate = 150;
    const minPrice = 50;
    let price = Math.max(area * baseRate, minPrice);
    if (specs.material === "vinyl_transparent") price *= 1.2;
    if (specs.finish === "matte") price *= 1.1;
    return Math.round(price * 100) / 100;
}

export interface CartItemArtwork {
    presentationType: string;
    selectedDesignUrl: string | null;
    enhancedDesignUrl: string | null;
    approvalScale: number;
    cutAreaScale: number;
}

export interface CartItem {
    id: string;
    product_type: ProductType;
    product_label: string;
    specs: ProductSpecs;
    artwork: CartItemArtwork;
    art_base64?: string;
    unit_price: number;
    quantity: number;
}
