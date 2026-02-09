/**
 * Cálculo de embalagem e peso para RÓTULOS (Correios).
 * Banners, faixas e outros produtos usarão tabelas separadas no futuro.
 *
 * Regras:
 * - Cartela: rótulos em folhas (tipo A4). Estima número de folhas e caixa para acomodar.
 * - Unidades: rótulos soltos. Estima caixa por volume aproximado.
 * - Peso mínimo Correios: 0,3 kg. Dimensões mínimas respeitadas.
 */

export type PresentationType = "cartela" | "unidades";

export interface RotulosPackageInput {
    quantity: number;
    format: PresentationType;
    widthMm: number;
    heightMm: number;
}

export interface PackageDimensions {
    pesoKg: number;
    comprimentoCm: number;
    larguraCm: number;
    alturaCm: number;
}

const PESO_MINIMO_KG = 0.3;
const DIM_MIN_CM = 16;
const DIM_MIN_ALTURA_CM = 2;

/**
 * Estima embalagem para rótulos conforme quantidade, formato (cartela/unidades) e tamanho (mm).
 */
export function calcRotulosPackage(input: RotulosPackageInput): PackageDimensions {
    const { quantity, format, widthMm, heightMm } = input;
    const qty = Math.max(1, Math.floor(quantity));
    const w = Math.max(10, widthMm);
    const h = Math.max(10, heightMm);

    if (format === "cartela") {
        return calcCartela(qty, w, h);
    }
    return calcUnidades(qty, w, h);
}

/** Cartela: folhas A4 (297x210 mm). Estima quantas folhas e caixa. */
function calcCartela(quantity: number, widthMm: number, heightMm: number): PackageDimensions {
    const A4_LARGURA_MM = 297;
    const A4_ALTURA_MM = 210;
    const rotulosPorFolha = Math.max(1, Math.floor(A4_LARGURA_MM / widthMm) * Math.floor(A4_ALTURA_MM / heightMm));
    const numFolhas = Math.max(1, Math.ceil(quantity / rotulosPorFolha));

    // Caixa para folhas: base A4 + margem, altura por quantidade de folhas
    const comprimentoCm = 32;
    const larguraCm = 24;
    const alturaCm = Math.min(20, Math.max(3, Math.round(2 + 1.2 * numFolhas)));

    // Peso: ~80g por folha (papel + rótulos) + ~150g embalagem
    const pesoKg = Math.max(PESO_MINIMO_KG, Math.round((0.15 + 0.08 * numFolhas) * 100) / 100);

    return {
        pesoKg,
        comprimentoCm: Math.max(DIM_MIN_CM, comprimentoCm),
        larguraCm: Math.max(11, larguraCm),
        alturaCm: Math.max(DIM_MIN_ALTURA_CM, alturaCm),
    };
}

/** Unidades: rótulos soltos. Caixa por área total e empilhamento. */
function calcUnidades(quantity: number, widthMm: number, heightMm: number): PackageDimensions {
    const areaMm2 = widthMm * heightMm * quantity;
    // Base da caixa proporcional à raiz da área (em cm)
    const ladoBaseCm = Math.sqrt(areaMm2 / 100) * 0.4;
    const comprimentoCm = Math.min(40, Math.max(DIM_MIN_CM, Math.ceil(ladoBaseCm * (widthMm / heightMm || 1))));
    const larguraCm = Math.min(35, Math.max(11, Math.ceil(ladoBaseCm * (heightMm / widthMm || 1))));
    const alturaCm = Math.min(15, Math.max(3, Math.ceil(2 + quantity / 80)));

    // Peso: ~2g por dm² de rótulos + embalagem
    const areaDm2 = areaMm2 / 10000;
    const pesoKg = Math.max(PESO_MINIMO_KG, Math.round((0.15 + areaDm2 * 0.002) * 100) / 100);

    return {
        pesoKg,
        comprimentoCm: Math.max(DIM_MIN_CM, comprimentoCm),
        larguraCm: Math.max(11, larguraCm),
        alturaCm: Math.max(DIM_MIN_ALTURA_CM, alturaCm),
    };
}
