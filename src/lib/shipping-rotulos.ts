/**
 * Cálculo de embalagem para RÓTULOS (e futuramente outros materiais).
 * Regra: não usar caixa quando não for necessário – envelope / pacote plano,
 * dimensões pelo metro quadrado e empilhamento, economizando espaço.
 *
 * - Cartela: folhas cortadas em tamanho menor, empilhadas (comprimento x largura = folha; altura = pilha).
 * - Unidades: rótulos em envelope plano (área por m², altura mínima).
 * Dimensões mínimas Correios: 13x8x1 cm. Usamos 16x11x2 cm para aceitação em mais modalidades.
 */

export type PresentationType = "cartela" | "unidades";

export interface RotulosPackageInput {
    quantity: number;
    format: PresentationType;
    widthMm: number;
    heightMm: number;
    /** Gramatura do material em g/m² (ex.: vinil adesivo 150g/m²). Se não vier, usa padrão. */
    gramatura?: number;
}

export interface PackageDimensions {
    pesoKg: number;
    comprimentoCm: number;
    larguraCm: number;
    alturaCm: number;
}

// Dimensões mínimas aceitas (Correios: 13x8x1; usamos 16x11x2 para envelope em várias modalidades)
const MIN_COMPRIMENTO_CM = 16;
const MIN_LARGURA_CM = 11;
const MIN_ALTURA_CM = 2;
const PESO_MINIMO_KG = 0.3;

// Gramatura padrão (g/m²) para rótulos/adesivos. Vinil adesivo principal: ~150 g/m².
const GRAMATURA_PADRAO_G_M2 = 150;
// Embalagem leve (envelope/sleeve/caixa pequena)
const PESO_EMBALAGEM_KG = 0.02;

/**
 * Estima embalagem para rótulos: pacote plano/envelope, sem caixa, otimizado por m².
 */
export function calcRotulosPackage(input: RotulosPackageInput): PackageDimensions {
    const { quantity, format, widthMm, heightMm } = input;
    const qty = Math.max(1, Math.floor(quantity));
    const w = Math.max(10, widthMm);
    const h = Math.max(10, heightMm);
    const areaMm2 = w * h * qty;
    const areaM2 = areaMm2 / 1_000_000;
    const gramatura = Math.max(50, input.gramatura ?? GRAMATURA_PADRAO_G_M2);
    // Peso do material em kg: (g/m² * m²) / 1000
    const pesoMaterialKg = (areaM2 * gramatura) / 1000;

    const base =
        format === "cartela"
            ? calcCartelaCompacta(qty, w, h)
            : calcUnidadesEnvelope(qty, w, h);

    const pesoKg = Math.max(
        PESO_MINIMO_KG,
        Math.round((pesoMaterialKg + PESO_EMBALAGEM_KG) * 100) / 100
    );

    return {
        pesoKg,
        comprimentoCm: base.comprimentoCm,
        larguraCm: base.larguraCm,
        alturaCm: base.alturaCm,
    };
}

/**
 * Cartela: folhas cortadas em tamanho menor (não A4 inteiro), empilhadas.
 * Comprimento x largura = tamanho da “folha cortada”; altura = espessura da pilha.
 */
function calcCartelaCompacta(
    quantity: number,
    widthMm: number,
    heightMm: number
): Omit<PackageDimensions, "pesoKg"> {
    const A4_LARGURA_MM = 297;
    const A4_ALTURA_MM = 210;
    const rotulosPorFolha = Math.max(
        1,
        Math.floor(A4_LARGURA_MM / widthMm) * Math.floor(A4_ALTURA_MM / heightMm)
    );
    const numFolhas = Math.max(1, Math.ceil(quantity / rotulosPorFolha));

    // Folha cortada (menor que A4) para caber em envelope; empilhar
    const comprimentoCm = Math.max(MIN_COMPRIMENTO_CM, 22);
    const larguraCm = Math.max(MIN_LARGURA_CM, 16);
    const alturaCm = Math.max(MIN_ALTURA_CM, Math.min(10, 0.5 + 0.2 * numFolhas));

    return {
        comprimentoCm,
        larguraCm,
        alturaCm,
    };
}

/**
 * Unidades: rótulos soltos em envelope plano. Base pela área total; altura mínima.
 */
function calcUnidadesEnvelope(
    _quantity: number,
    widthMm: number,
    heightMm: number
): Omit<PackageDimensions, "pesoKg"> {
    const comprimentoCm = Math.max(
        MIN_COMPRIMENTO_CM,
        Math.min(35, Math.ceil(Math.max(widthMm, heightMm) / 10) + 2)
    );
    const larguraCm = Math.max(
        MIN_LARGURA_CM,
        Math.min(30, Math.ceil(Math.min(widthMm, heightMm) / 10) + 2)
    );
    const alturaCm = MIN_ALTURA_CM;

    return {
        comprimentoCm,
        larguraCm,
        alturaCm,
    };
}
