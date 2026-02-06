/**
 * Compila a pasta do pedido: JSON de dados + PDF arte, etiqueta e comprovante.
 * Faz upload no bucket Supabase "pedidos" em pedidos/{order_id}/
 */

import { supabaseAdmin } from "@/lib/supabase-server";
import type { PedidoRow, DadosPedidoJson } from "@/lib/order-types";

const BUCKET = "pedidos";

/** Formato para label: 10cm x 8cm. jsPDF usa mm. */
const ETIQUETA_W_MM = 100;
const ETIQUETA_H_MM = 80;

/** Gera o conteúdo do Dados_IDpedido.json */
function buildDadosJson(pedido: PedidoRow): DadosPedidoJson {
    const c = (pedido.customer_json || {}) as Record<string, string>;
    const nameParts = ((c.name as string) || "").trim().split(/\s+/);
    const nome = nameParts[0] || "";
    const sobrenome = nameParts.slice(1).join(" ") || "";
    const s = (pedido.shipping_json || {}) as Record<string, string>;
    const endereco = [
        s.street,
        s.number,
        s.complement,
        s.neighborhood,
        s.city,
        s.state,
        (s.zipCode || "").replace(/(\d{5})(\d{3})/, "$1-$2"),
    ]
        .filter(Boolean)
        .join(", ");
    const spec = (pedido.specs_json || {}) as Record<string, unknown>;
    return {
        ID_PEDIDO: pedido.order_id_mp,
        cliente: {
            NOME: nome,
            SOBRENOME: sobrenome,
            EMAIL: (c.email as string) || "",
            TELEFONE: (c.phone as string) || "",
            CPF_CNPJ: (c.document as string) || "",
        },
        endereco_completo: endereco,
        forma_pagamento: pedido.payment_method || "não informado",
        parcelas: pedido.installments ?? undefined,
        produto: {
            TAMANHO_MM: {
                largura: (spec.width as number) ?? 0,
                altura: (spec.height as number) ?? 0,
            },
            FORMATO: String(spec.format ?? ""),
            QUANTIDADE: (spec.quantity as number) ?? 0,
            CARTELA_OU_UNIDADES: pedido.presentation_type || "cartela",
        },
        totais: {
            valor_produto: Number(pedido.total_price) - Number(pedido.shipping_cost || 0),
            frete: Number(pedido.shipping_cost || 0),
            total: Number(pedido.total_price || 0),
        },
        created_at: pedido.created_at,
    };
}

/** Gera PDF da etiqueta de envio (10x8 cm) com logo, remetente, destinatário, código e ID. */
async function buildEtiquetaPdf(pedido: PedidoRow): Promise<Uint8Array> {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [ETIQUETA_W_MM, ETIQUETA_H_MM] });
    const pageW = ETIQUETA_W_MM;
    const margin = 5;
    let y = margin;
    const lineH = 5;

    doc.setFontSize(10);
    doc.text("F9 - Etiqueta de envio", margin, y);
    y += lineH + 2;
    doc.setFontSize(8);
    // Remetente (exemplo – ajuste com seus dados)
    doc.text("REMETENTE:", margin, y);
    y += lineH;
    doc.text("F9 Gráfica / Seu endereço completo aqui", margin, y);
    y += lineH + 4;
    doc.text("DESTINATÁRIO:", margin, y);
    y += lineH;
    const s = (pedido.shipping_json || {}) as Record<string, string>;
    const c = (pedido.customer_json || {}) as Record<string, string>;
    const dest = [
        (c.name as string) || "",
        [s.street, s.number, s.complement].filter(Boolean).join(", "),
        [s.neighborhood, s.city, s.state].filter(Boolean).join(" - "),
        (s.zipCode || "").replace(/(\d{5})(\d{3})/, "$1-$2"),
    ].join(" | ");
    doc.text(dest, margin, y);
    y += lineH + 4;
    doc.text(`ID Pedido: ${pedido.order_id_mp}`, margin, y);
    y += lineH;
    doc.text(`Código de barras: ${pedido.order_id_mp}`, margin, y);

    return doc.output("arraybuffer") as Promise<Uint8Array>;
}

/** Gera PDF do comprovante de pagamento. */
async function buildComprovantePdf(pedido: PedidoRow): Promise<Uint8Array> {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const margin = 15;
    let y = 20;
    const lineH = 6;

    doc.setFontSize(14);
    doc.text("Comprovante de pagamento", margin, y);
    y += lineH + 4;
    doc.setFontSize(10);
    doc.text(`ID do pedido: ${pedido.order_id_mp}`, margin, y);
    y += lineH;
    doc.text(`Forma: ${pedido.payment_method || "-"}`, margin, y);
    y += lineH;
    if (pedido.installments) doc.text(`Parcelas: ${pedido.installments}x`, margin, y);
    y += lineH;
    doc.text(`Total: R$ ${Number(pedido.total_price || 0).toFixed(2)}`, margin, y);
    y += lineH + 4;
    if (pedido.payment_response_json && typeof pedido.payment_response_json === "object") {
        doc.text("Dados do pagamento (resumo):", margin, y);
        y += lineH;
        doc.setFontSize(8);
        const str = JSON.stringify(pedido.payment_response_json, null, 2).slice(0, 2000);
        const lines = doc.splitTextToSize(str, 180);
        doc.text(lines, margin, y);
    }

    return doc.output("arraybuffer") as Promise<Uint8Array>;
}

/** Gera PDF da arte final (imagem aprovada + área de corte). Se artBase64 não existir, gera PDF com aviso. */
async function buildArtePdf(
    pedido: PedidoRow,
    artBase64: string | undefined
): Promise<Uint8Array> {
    const { jsPDF } = await import("jspdf");
    const spec = (pedido.specs_json || {}) as Record<string, number>;
    const w = (spec.width ?? 50) / 10; // cm
    const h = (spec.height ?? 50) / 10;
    const doc = new jsPDF({ unit: "cm", format: [Math.max(w + 2, 10), Math.max(h + 2, 10)] });
    const margin = 1;
    doc.setFontSize(8);
    doc.text("Arte final aprovada | Área de corte marcada | 300 DPI / CMYK recomendado na arte original", margin, margin);
    if (artBase64) {
        try {
            const dataUri = artBase64.startsWith("data:") ? artBase64 : `data:image/png;base64,${artBase64}`;
            doc.addImage(dataUri, "PNG", margin, margin + 0.5, w, h);
        } catch {
            doc.text("[Imagem da arte não pôde ser inserida; use o arquivo enviado pelo cliente.]", margin, margin + 1);
        }
    } else {
        doc.text("[Arte não enviada em base64; anexar manualmente a arte aprovada.]", margin, margin + 1);
    }
    doc.text(`Pedido: ${pedido.order_id_mp} | ${pedido.presentation_type || "cartela"}`, margin, doc.internal.pageSize.height - 0.5);
    return doc.output("arraybuffer") as Promise<Uint8Array>;
}

/** Nome do arquivo da arte: PRODUTO_FORMATO_TAMANHO_QUANTIDADE_CARTELA ou UNIDADE_IDpedido.pdf */
function arteFileName(pedido: PedidoRow): string {
    const spec = (pedido.specs_json || {}) as Record<string, unknown>;
    const prod = (pedido.product_type || "rotulo").toUpperCase();
    const fmt = String(spec.format || "square").toUpperCase();
    const tam = `${spec.width || 0}x${spec.height || 0}`;
    const qtd = spec.quantity ?? 0;
    const cartela = (pedido.presentation_type || "cartela").toUpperCase();
    return `PRODUTO_${prod}_${fmt}_${tam}_${qtd}_${cartela}_${pedido.order_id_mp}.pdf`;
}

/** Compila a pasta do pedido e faz upload no Storage. Atualiza package_path e package_generated_at. */
export async function compileOrder(pedidoId: string, artBase64?: string): Promise<{ ok: boolean; error?: string }> {
    if (!supabaseAdmin) {
        return { ok: false, error: "Supabase não configurado" };
    }

    const { data: pedido, error: fetchErr } = await supabaseAdmin
        .from("pedidos")
        .select("*")
        .eq("id", pedidoId)
        .single();

    if (fetchErr || !pedido) {
        return { ok: false, error: fetchErr?.message || "Pedido não encontrado" };
    }

    const row = pedido as unknown as PedidoRow;
    const orderId = row.order_id_mp;
    const prefix = `${orderId}/`;

    try {
        const dadosJson = buildDadosJson(row);
        const dadosContent = JSON.stringify(dadosJson, null, 2);
        const dadosName = `Dados_${orderId}.json`;

        const [etiquetaPdf, comprovantePdf, artePdf] = await Promise.all([
            buildEtiquetaPdf(row),
            buildComprovantePdf(row),
            buildArtePdf(row, artBase64),
        ]);

        const arteName = arteFileName(row);
        const etiquetaName = `Etiqueta_${orderId}.pdf`;
        const comprovanteName = `Comprovante_${orderId}.pdf`;

        const uploads = [
            { path: prefix + dadosName, body: new Blob([dadosContent], { type: "application/json" }) },
            { path: prefix + etiquetaName, body: new Blob([etiquetaPdf], { type: "application/pdf" }) },
            { path: prefix + comprovanteName, body: new Blob([comprovantePdf], { type: "application/pdf" }) },
            { path: prefix + arteName, body: new Blob([artePdf], { type: "application/pdf" }) },
        ];

        for (const u of uploads) {
            const { error: upErr } = await supabaseAdmin.storage.from(BUCKET).upload(u.path, u.body, {
                contentType: u.body.type,
                upsert: true,
            });
            if (upErr) {
                console.error("[compile-order] Upload falhou:", u.path, upErr);
                return { ok: false, error: `Upload falhou: ${u.path}` };
            }
        }

        const { error: updateErr } = await supabaseAdmin
            .from("pedidos")
            .update({
                package_path: prefix,
                package_generated_at: new Date().toISOString(),
            })
            .eq("id", pedidoId);

        if (updateErr) {
            return { ok: false, error: updateErr.message };
        }
        return { ok: true };
    } catch (err) {
        console.error("[compile-order] Erro:", err);
        return { ok: false, error: err instanceof Error ? err.message : "Erro ao compilar" };
    }
}
