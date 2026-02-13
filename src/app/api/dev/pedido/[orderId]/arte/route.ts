import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import type { PedidoRow } from "@/lib/order-types";

export const runtime = "nodejs";

type Params = { params: Promise<{ orderId: string }> };

const BUCKET = "pedidos";

/** Mesmo padrão do compile-order para encontrar o arquivo no bucket. */
function arteFileName(row: PedidoRow): string {
    const spec = (row.specs_json || {}) as Record<string, unknown>;
    const prodType = (row.product_type || "rotulo").toString().toLowerCase();
    const prod =
        prodType === "rotulo" ? "Rotulo" : prodType.charAt(0).toUpperCase() + prodType.slice(1);
    const fmtRaw = String(spec.format || "square").toLowerCase();
    const fmt =
        fmtRaw === "square"
            ? "Quadrado"
            : fmtRaw === "rectangular"
              ? "Retangular"
              : fmtRaw === "circle"
                ? "Redondo"
                : fmtRaw === "oval"
                  ? "Oval"
                  : "Especial";
    const width = (spec.width as number | undefined) ?? 0;
    const height = (spec.height as number | undefined) ?? 0;
    const tam = `${width}x${height}`;
    const qtd = (spec.quantity as number | undefined) ?? 0;
    const qtdStr = `${qtd}un`;
    const finishRaw = String(spec.finish || "gloss").toLowerCase();
    const finish = finishRaw === "matte" ? "fosco" : "brilho";
    const presentation = (row.presentation_type || "cartela").toLowerCase();
    const presStr = presentation === "unidades" ? "Unidades" : "Cartela";
    return `${prod}-${fmt}_${tam}_${qtdStr}_${finish}_${presStr}_ID${row.order_id_mp}.pdf`;
}

export async function GET(_request: NextRequest, { params }: Params) {
    if (!supabaseAdmin) {
        return NextResponse.json({ error: "Supabase não configurado" }, { status: 503 });
    }

    const { orderId } = await params;
    const order = (orderId || "").trim();
    if (!order) {
        return NextResponse.json({ error: "orderId é obrigatório" }, { status: 400 });
    }

    const { data: pedido, error } = await supabaseAdmin
        .from("pedidos")
        .select("*")
        .eq("order_id_mp", order)
        .maybeSingle();

    if (error || !pedido) {
        return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    const row = pedido as unknown as PedidoRow;
    const fileName = arteFileName(row);
    const path = `${row.order_id_mp}/${fileName}`;

    const { data: file, error: downloadErr } = await supabaseAdmin.storage.from(BUCKET).download(path);
    if (downloadErr || !file) {
        return NextResponse.json({ error: "Arquivo da arte não encontrado no Storage" }, { status: 404 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = Buffer.from(arrayBuffer);

    return new NextResponse(bytes, {
        status: 200,
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${fileName}"`,
        },
    });
}

