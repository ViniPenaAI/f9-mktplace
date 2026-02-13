import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";

/**
 * Valida a assinatura do webhook (header x-signature) conforme documentação do MP.
 * Template: id:[data.id];request-id:[x-request-id];ts:[ts];
 * HMAC-SHA256(secret, manifest) em hex deve ser igual a v1.
 */
function verifyWebhookSignature(
    secret: string,
    xSignature: string | null,
    xRequestId: string | null,
    dataId: string | null
): boolean {
    if (!xSignature || !secret) return false;
    const parts = xSignature.split(",");
    let ts: string | null = null;
    let v1: string | null = null;
    for (const part of parts) {
        const [key, value] = part.split("=").map((s) => s.trim());
        if (key === "ts") ts = value;
        else if (key === "v1") v1 = value;
    }
    if (!ts || !v1) return false;
    const id = dataId ? (typeof dataId === "string" && /^[a-zA-Z0-9]+$/.test(dataId) ? dataId.toLowerCase() : dataId) : "";
    const manifestParts: string[] = [];
    if (id) manifestParts.push(`id:${id}`);
    if (xRequestId) manifestParts.push(`request-id:${xRequestId}`);
    manifestParts.push(`ts:${ts}`);
    const manifest = manifestParts.join(";") + ";";
    const expected = createHmac("sha256", secret).update(manifest).digest("hex");
    return expected === v1;
}

/**
 * Webhook para confirmação de pagamento do Mercado Pago.
 * URL: https://www.f9visual.com.br/api/mercadopago/webhook
 *
 * Se MERCADO_PAGO_WEBHOOK_SECRET estiver definido, valida o header x-signature.
 * Ao receber topic "order", busca o pedido na API do MP; se status for pago,
 * atualiza o pedido no Supabase e dispara a compilação da pasta (JSON + PDFs).
 */
export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get("content-type") || "";
        let payload: Record<string, unknown> = {};

        if (contentType.includes("application/json")) {
            payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
        } else if (contentType.includes("application/x-www-form-urlencoded")) {
            const text = await request.text();
            const params = new URLSearchParams(text);
            payload = { id: params.get("id"), topic: params.get("topic"), data_id: params.get("data_id") };
        }

        // Alguns webhooks (como "order") mandam o ID dentro de data.id (JSON) ou data.id na query.
        const rawId = String(payload.id ?? payload.data_id ?? "").trim();
        const dataFromBody = payload.data as { id?: string } | undefined;
        const dataIdFromBody = dataFromBody?.id != null ? String(dataFromBody.id) : null;
        const dataIdFromQuery = request.nextUrl.searchParams.get("data.id");
        const effectiveId = (dataIdFromQuery ?? dataIdFromBody ?? rawId)?.trim() || "";

        const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
        const xSignature = request.headers.get("x-signature");
        const xRequestId = request.headers.get("x-request-id");
        if (secret && !verifyWebhookSignature(secret, xSignature, xRequestId, effectiveId || null)) {
            console.warn("[Mercado Pago Webhook] Assinatura inválida ou ausente. Notificação ignorada.");
            return NextResponse.json({ received: true }, { status: 200 });
        }

        const topic = (payload.topic ?? payload.type) as string;
        console.log("[Mercado Pago Webhook] Recebido:", { id: effectiveId, topic });

        if (!effectiveId) {
            return NextResponse.json({ received: true }, { status: 200 });
        }

        if (topic === "order" || topic === "orders" || topic === "merchant_order") {
            const orderId = effectiveId;
            const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
            if (accessToken && supabaseAdmin) {
                try {
                    const res = await fetch(`https://api.mercadopago.com/v1/orders/${orderId}`, {
                        headers: { Authorization: `Bearer ${accessToken}` },
                    });
                    const order = (await res.json().catch(() => ({}))) as Record<string, unknown>;
                    const status = order.status as string | undefined;
                    if (status && (status === "approved" || status === "processed")) {
                        const { data: pedido } = await supabaseAdmin
                            .from("pedidos")
                            .select("id, package_generated_at")
                            .eq("order_id_mp", orderId)
                            .maybeSingle();

                        if (pedido) {
                            await supabaseAdmin
                                .from("pedidos")
                                .update({ status, updated_at: new Date().toISOString() })
                                .eq("id", pedido.id);
                            if (!pedido.package_generated_at) {
                                try {
                                    const { compileOrder } = await import("@/lib/compile-order");
                                    const result = await compileOrder(pedido.id);
                                    if (result.ok) {
                                        console.log("[Mercado Pago Webhook] Compilação OK, pedido:", orderId);
                                    } else {
                                        console.error("[Mercado Pago Webhook] Compilação falhou:", result.error);
                                    }
                                } catch (err) {
                                    console.error("[Mercado Pago Webhook] Erro ao compilar:", err);
                                }
                            }
                        } else {
                            console.log("[Mercado Pago Webhook] Pedido não encontrado no Supabase:", orderId);
                        }
                    }
                } catch (err) {
                    console.error("[Mercado Pago Webhook] Erro ao processar order:", err);
                }
            }
        }

        return NextResponse.json({ received: true }, { status: 200 });
    } catch (err) {
        console.error("[Mercado Pago Webhook] Erro:", err);
        return NextResponse.json({ received: false }, { status: 200 });
    }
}

export async function GET() {
    return NextResponse.json({ ok: true, webhook: "mercadopago" }, { status: 200 });
}
