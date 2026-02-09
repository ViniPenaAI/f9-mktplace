import { NextRequest, NextResponse } from "next/server";
import { gerarEtiquetaMelhorEnvio, obterUrlImpressaoMelhorEnvio } from "@/lib/frete/melhorEnvioClient";
import type { EtiquetaEndereco } from "@/lib/frete/melhorEnvioClient";
import { supabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";

type Body = {
    pedidoId?: string;
    order_id_mp?: string;
    serviceId: string;
    provider?: string;
    from: EtiquetaEndereco;
    to: EtiquetaEndereco;
    package: {
        pesoKg: number;
        larguraCm: number;
        alturaCm: number;
        comprimentoCm: number;
        valorDeclarado: number;
    };
};

function normEndereco(e: Record<string, unknown>): EtiquetaEndereco {
    return {
        nome: String(e?.nome ?? ""),
        documento: String(e?.documento ?? ""),
        telefone: String(e?.telefone ?? ""),
        email: String(e?.email ?? ""),
        cep: String(e?.cep ?? ""),
        rua: String(e?.rua ?? e?.street ?? ""),
        numero: String(e?.numero ?? e?.number ?? ""),
        complemento: e?.complemento != null ? String(e.complemento) : undefined,
        bairro: String(e?.bairro ?? e?.district ?? e?.neighborhood ?? ""),
        cidade: String(e?.cidade ?? e?.city ?? ""),
        estado: String(e?.estado ?? e?.state ?? e?.state_abbr ?? ""),
    };
}

export async function POST(request: NextRequest) {
    let body: Body;
    try {
        body = (await request.json()) as Body;
    } catch {
        return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
    }

    const { pedidoId, order_id_mp, serviceId, provider, from, to, package: pkg } = body;
    if (!serviceId || !from || !to || !pkg) {
        return NextResponse.json(
            { error: "serviceId, from, to e package são obrigatórios" },
            { status: 400 }
        );
    }

    const useProvider = (provider ?? "melhor-envio") as string;
    if (useProvider !== "melhor-envio") {
        return NextResponse.json(
            { error: "Apenas provider melhor-envio está implementado" },
            { status: 400 }
        );
    }

    let pedidoUuid: string | null = null;
    if (pedidoId) {
        pedidoUuid = pedidoId;
    } else if (order_id_mp && supabaseAdmin) {
        const { data: row } = await supabaseAdmin
            .from("pedidos")
            .select("id")
            .eq("order_id_mp", order_id_mp)
            .single();
        if (row?.id) pedidoUuid = row.id as string;
    }
    if (!pedidoUuid && supabaseAdmin) {
        return NextResponse.json(
            { error: "pedidoId ou order_id_mp é obrigatório e deve existir na tabela pedidos" },
            { status: 400 }
        );
    }

    try {
        const etiqueta = await gerarEtiquetaMelhorEnvio({
            serviceId,
            from: normEndereco(from as unknown as Record<string, unknown>),
            to: normEndereco(to as unknown as Record<string, unknown>),
            package: {
                pesoKg: Number(pkg.pesoKg) || 0.3,
                larguraCm: Number(pkg.larguraCm) || 16,
                alturaCm: Number(pkg.alturaCm) || 16,
                comprimentoCm: Number(pkg.comprimentoCm) || 16,
                valorDeclarado: Number(pkg.valorDeclarado) || 0,
            },
        });
        const providerId = String(etiqueta.id ?? "");
        const codigoRastreio = etiqueta.tracking ?? null;
        const urlImpressao = obterUrlImpressaoMelhorEnvio([providerId]);

        if (supabaseAdmin && pedidoUuid) {
            await supabaseAdmin.from("etiquetas_frete").upsert(
                {
                    pedido_id: pedidoUuid,
                    provider: useProvider,
                    provider_etiqueta_id: providerId,
                    url_impressao: urlImpressao ?? undefined,
                    codigo_rastreio: codigoRastreio ?? undefined,
                    status: (etiqueta.status as string) ?? "pending_payment",
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "pedido_id" }
            );
        }

        return NextResponse.json({
            etiqueta: {
                id: providerId,
                protocol: etiqueta.protocol ?? undefined,
                tracking: codigoRastreio,
                status: etiqueta.status ?? "pending_payment",
                url_impressao: urlImpressao ?? undefined,
            },
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao gerar etiqueta";
        console.error("[POST /api/frete/gerar-etiqueta]", err);
        return NextResponse.json(
            { error: "Erro ao gerar etiqueta", detalhe: message },
            { status: 500 }
        );
    }
}
