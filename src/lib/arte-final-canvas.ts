/**
 * Gera a imagem "arte final" igual à que o cliente vê no resumo (Step4):
 * imagem em contain + approvalScale/offset + recorte central (cutAreaScale).
 * Usado no PDF e no artBase64 enviado ao backend.
 */

import type { ProductFormat } from "@/store/configurator-store";

const PX_PER_MM = 15; // resolução para o canvas (nitidez no PDF)
const MAX_SIDE = 3000;

function loadImage(source: string | File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Falha ao carregar imagem"));
        if (typeof source === "string") {
            img.src = source;
        } else {
            const url = URL.createObjectURL(source);
            img.src = url;
            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve(img);
            };
        }
    });
}

export interface ArteFinalParams {
    imageSource: string | File;
    widthMm: number;
    heightMm: number;
    format: ProductFormat;
    cutAreaScale: number;
    approvalScale: number;
    approvalOffsetX: number;
    approvalOffsetY: number;
}

/**
 * Retorna a imagem da "arte final" (mesma que aparece no resumo) em base64 PNG.
 */
export async function getArteFinalImageBase64(params: ArteFinalParams): Promise<string> {
    const {
        imageSource,
        widthMm,
        heightMm,
        format,
        cutAreaScale,
        approvalScale,
        approvalOffsetX,
        approvalOffsetY,
    } = params;

    const img = await loadImage(imageSource);

    let outW = Math.round(widthMm * PX_PER_MM);
    let outH = Math.round(heightMm * PX_PER_MM);
    const maxSide = Math.max(outW, outH);
    if (maxSide > MAX_SIDE) {
        const scale = MAX_SIDE / maxSide;
        outW = Math.round(outW * scale);
        outH = Math.round(outH * scale);
    }
    outW = Math.max(1, outW);
    outH = Math.max(1, outH);

    const temp = document.createElement("canvas");
    temp.width = outW;
    temp.height = outH;
    const tctx = temp.getContext("2d");
    if (!tctx) throw new Error("Canvas 2d não disponível");

    // "contain": imagem cabe no retângulo outW x outH
    const imgAspect = img.width / img.height;
    const boxAspect = outW / outH;
    let drawW: number, drawH: number;
    if (imgAspect > boxAspect) {
        drawW = outW;
        drawH = outW / imgAspect;
    } else {
        drawH = outH;
        drawW = outH * imgAspect;
    }
    const drawX = (outW - drawW) / 2;
    const drawY = (outH - drawH) / 2;

    const centerX = outW / 2;
    const centerY = outH / 2;
    // No CSS do Step4: transform scale(s) translate(x%, y%) — aplica primeiro translate, depois scale; % é do elemento (outW×outH). O offset efetivo na tela fica (x%*outW*scale, y%*outH*scale).
    const offsetX = (approvalOffsetX / 100) * outW * approvalScale;
    const offsetY = (approvalOffsetY / 100) * outH * approvalScale;

    tctx.save();
    tctx.translate(centerX + offsetX, centerY + offsetY);
    tctx.scale(approvalScale, approvalScale);
    tctx.translate(-centerX, -centerY);
    tctx.drawImage(img, drawX, drawY, drawW, drawH);
    tctx.restore();

    // Recorte central: mesma lógica que Step4 (cutAreaScale = porção central)
    const s = format === "special" ? 1 : Math.min(1, Math.max(0.5, cutAreaScale));
    const cropW = Math.max(1, Math.round(outW * s));
    const cropH = Math.max(1, Math.round(outH * s));
    const cropX = (outW - cropW) / 2;
    const cropY = (outH - cropH) / 2;

    const out = document.createElement("canvas");
    out.width = outW;
    out.height = outH;
    const octx = out.getContext("2d");
    if (!octx) throw new Error("Canvas 2d não disponível");
    octx.drawImage(temp, cropX, cropY, cropW, cropH, 0, 0, outW, outH);

    // Redondo e oval: mesma regra do Step4 — ellipse(50% 50% at center) = elipse proporcional ao retângulo (50×50 vira círculo; 80×50 vira oval). Fora da forma fica TRANSPARENTE (não branco), para na impressão só sair tinta na área da arte.
    if (format === "circle" || format === "oval") {
        const masked = document.createElement("canvas");
        masked.width = outW;
        masked.height = outH;
        const mctx = masked.getContext("2d");
        if (!mctx) return out.toDataURL("image/png").split(",")[1] ?? "";
        mctx.beginPath();
        mctx.ellipse(outW / 2, outH / 2, outW / 2, outH / 2, 0, 0, 2 * Math.PI);
        mctx.closePath();
        mctx.clip();
        mctx.drawImage(out, 0, 0);
        return masked.toDataURL("image/png").split(",")[1] ?? "";
    }

    return out.toDataURL("image/png").split(",")[1] ?? "";
}
