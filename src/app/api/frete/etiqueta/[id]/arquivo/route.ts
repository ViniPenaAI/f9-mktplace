import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { fetchPdfEtiquetaMelhorEnvio } from "@/lib/frete/melhorEnvioClient";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
    const { id } = await params;
    if (!id?.trim()) {
        return NextResponse.json({ error: "ID da etiqueta é obrigatório" }, { status: 400 });
    }

    if (!supabaseAdmin) {
        return NextResponse.json({ error: "Supabase não configurado" }, { status: 503 });
    }

    const isUuid = /^[0-9a-f-]{36}$/i.test(id.trim());
    let providerEtiquetaId: string;
    let provider: string;

    if (isUuid) {
        const { data: row, error } = await supabaseAdmin
            .from("etiquetas_frete")
            .select("provider, provider_etiqueta_id")
            .eq("id", id.trim())
            .single();
        if (error || !row) {
            return NextResponse.json({ error: "Etiqueta não encontrada" }, { status: 404 });
        }
        providerEtiquetaId = row.provider_etiqueta_id as string;
        provider = (row.provider as string) ?? "melhor-envio";
    } else {
        providerEtiquetaId = id.trim();
        provider = "melhor-envio";
    }

    if (provider !== "melhor-envio") {
        return NextResponse.json(
            { error: "Download de arquivo só disponível para etiquetas Melhor Envio" },
            { status: 400 }
        );
    }

    try {
        const res = await fetchPdfEtiquetaMelhorEnvio([providerEtiquetaId]);
        if (!res.ok) {
            const text = await res.text();
            console.error("[GET /api/frete/etiqueta/.../arquivo] Melhor Envio:", res.status, text?.slice(0, 300));
            return NextResponse.json(
                { error: "Falha ao obter PDF da etiqueta", detalhe: res.statusText },
                { status: 502 }
            );
        }
        const blob = await res.blob();
        const headers = new Headers();
        headers.set("Content-Type", res.headers.get("Content-Type") ?? "application/pdf");
        const disposition = res.headers.get("Content-Disposition");
        if (disposition) headers.set("Content-Disposition", disposition);
        return new NextResponse(blob, { status: 200, headers });
    } catch (err) {
        console.error("[GET /api/frete/etiqueta/.../arquivo]", err);
        return NextResponse.json(
            { error: "Erro ao obter arquivo da etiqueta", detalhe: err instanceof Error ? err.message : "" },
            { status: 500 }
        );
    }
}
