import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
    try {
        const urlObj = new URL(request.url);
        const search = urlObj.searchParams;

        const imgUrl = search.get("url");
        const wMm = Number(search.get("w") || "50");
        const hMm = Number(search.get("h") || "50");
        const formatParam = (search.get("format") || "square").toLowerCase();
        const qty = search.get("qty") || "0";
        const finishParam = (search.get("finish") || "gloss").toLowerCase();
        const presentationParam = (search.get("presentation") || "cartela").toLowerCase();
        if (!imgUrl) {
            return NextResponse.json({ error: "Parâmetro url é obrigatório" }, { status: 400 });
        }

        const res = await fetch(imgUrl);
        if (!res.ok) {
            return NextResponse.json(
                { error: "Falha ao baixar imagem da arte", detalhe: res.statusText },
                { status: 502 }
            );
        }
        const arrayBuffer = await res.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");

        const { jsPDF } = await import("jspdf");
        const widthCm = Math.max((wMm || 50) / 10, 1);
        const heightCm = Math.max((hMm || 50) / 10, 1);
        const isLandscape = (wMm || 50) >= (hMm || 50);
        const doc = new jsPDF({
            unit: "cm",
            orientation: isLandscape ? "landscape" : "portrait",
            format: isLandscape ? [widthCm, heightCm] : [heightCm, widthCm],
        });

        try {
            const dataUri = `data:image/png;base64,${base64}`;
            doc.addImage(dataUri, "PNG", 0, 0, widthCm, heightCm);
        } catch {
            // Se a imagem não puder ser desenhada, gera PDF vazio do tamanho da peça.
        }

        const fmtLabel =
            formatParam === "square"
                ? "Quadrado"
                : formatParam === "rectangular"
                  ? "Retangular"
                  : formatParam === "circle"
                    ? "Redondo"
                    : formatParam === "oval"
                      ? "Oval"
                      : "Especial";
        const finishLabel = finishParam === "matte" ? "fosco" : "brilho";
        const presLabel = presentationParam === "unidades" ? "Unidades" : "Cartela";
        const fileName = `ARTE_PREVIEW_${fmtLabel}_${wMm}x${hMm}_${qty}un_${finishLabel}_${presLabel}.pdf`;
        const pdfBytes = doc.output("arraybuffer");
        return new NextResponse(Buffer.from(pdfBytes), {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${fileName}"`,
            },
        });
    } catch (err) {
        console.error("[dev/preview-arte] Erro:", err);
        return NextResponse.json(
            { error: "Erro ao gerar prévia da arte", detalhe: err instanceof Error ? err.message : String(err) },
            { status: 500 }
        );
    }
}

