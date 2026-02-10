import { NextRequest, NextResponse } from "next/server";
import { cotarFrete } from "@/lib/frete/freteService";
import type { ItemParaCotacao } from "@/lib/frete/freteService";

export const runtime = "nodejs";

type Body = {
    cepOrigem?: string;
    cepDestino?: string;
    itens?: Array<{
        pesoKg?: number;
        larguraCm?: number;
        alturaCm?: number;
        comprimentoCm?: number;
        valorDeclarado?: number;
    }>;
    providers?: string[];
    /** Se true, usa seguro na cotação; se false, sem seguro. Se omitido, usa padrão do servidor. */
    insurance?: boolean;
};

export async function POST(request: NextRequest) {
    let body: Body = {};
    try {
        body = (await request.json()) as Body;
    } catch {
        return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
    }

    const cepOrigem = (body.cepOrigem ?? process.env.CEP_ORIGEM ?? "").toString().replace(/\D/g, "").slice(0, 8);
    const cepDestino = (body.cepDestino ?? "").toString().replace(/\D/g, "").slice(0, 8);

    if (cepOrigem.length !== 8) {
        return NextResponse.json(
            { error: "CEP de origem inválido (8 dígitos). Configure CEP_ORIGEM no .env ou envie cepOrigem." },
            { status: 400 }
        );
    }
    if (cepDestino.length !== 8) {
        return NextResponse.json(
            { error: "CEP de destino inválido (8 dígitos)" },
            { status: 400 }
        );
    }

    const itensRaw = Array.isArray(body.itens) ? body.itens : [];
    const itens: ItemParaCotacao[] =
        itensRaw.length > 0
            ? itensRaw.map((i) => ({
                  pesoKg: Number(i.pesoKg) || 0.3,
                  larguraCm: Number(i.larguraCm) || 16,
                  alturaCm: Number(i.alturaCm) || 16,
                  comprimentoCm: Number(i.comprimentoCm) || 16,
                  valorDeclarado: Number(i.valorDeclarado) || 0,
              }))
            : [
                  {
                      pesoKg: Number(process.env.SHIPPING_PESO_KG) || 0.3,
                      larguraCm: Number(process.env.SHIPPING_LARGURA_CM) || 16,
                      alturaCm: Number(process.env.SHIPPING_ALTURA_CM) || 16,
                      comprimentoCm: Number(process.env.SHIPPING_COMPRIMENTO_CM) || 16,
                      valorDeclarado: 0,
                  },
              ];

    const providers = Array.isArray(body.providers)
        ? (body.providers.filter((p) => p === "melhor-envio" || p === "superfrete") as ("melhor-envio" | "superfrete")[])
        : undefined;

    try {
        const resultado = await cotarFrete({
            cepOrigem,
            cepDestino,
            itens,
            providers,
            insurance: typeof body.insurance === "boolean" ? body.insurance : undefined,
        });
        // Inclui o que foi enviado na cotação (para entender formação do valor do frete)
        return NextResponse.json({
            ...resultado,
            dadosEnviados: {
                cepOrigem,
                cepDestino,
                itens: itens.map((i) => ({
                    pesoKg: i.pesoKg,
                    larguraCm: i.larguraCm,
                    alturaCm: i.alturaCm,
                    comprimentoCm: i.comprimentoCm,
                    valorDeclarado: i.valorDeclarado,
                    pesoCubadoKg: (i.larguraCm * i.alturaCm * i.comprimentoCm) / 6000,
                })),
                insurance: typeof body.insurance === "boolean" ? body.insurance : null,
            },
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao calcular frete";
        console.error("[POST /api/frete/cotar]", err);
        return NextResponse.json(
            { error: "Erro ao calcular frete", detalhe: message },
            { status: 500 }
        );
    }
}
