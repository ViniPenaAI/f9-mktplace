import { NextResponse } from "next/server";

/**
 * Rota de teste: chama GET /v1/payment_methods no Mercado Pago.
 * Use para conferir se o token de TESTE está sendo aceito (200) ou rejeitado (401).
 * DELETE esta pasta depois de resolver o problema.
 */
export async function GET() {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
        return NextResponse.json(
            { error: "MERCADO_PAGO_ACCESS_TOKEN não configurado" },
            { status: 500 }
        );
    }

    try {
        const res = await fetch("https://api.mercadopago.com/v1/payment_methods", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            console.log("[MP Test] payment_methods falhou:", res.status, data);
            return NextResponse.json(
                {
                    ok: false,
                    status: res.status,
                    message: (data as { message?: string }).message || "Token rejeitado pelo Mercado Pago.",
                    hint: "Se for 401 'live credentials', use as credenciais da seção Credenciais de TESTE e reinicie o servidor.",
                },
                { status: 200 }
            );
        }

        return NextResponse.json({
            ok: true,
            message: "Token aceito. Se o PIX ainda der 401, o problema pode ser específico do endpoint de pagamentos.",
        });
    } catch (err) {
        console.error("[MP Test] Erro:", err);
        return NextResponse.json(
            { ok: false, error: err instanceof Error ? err.message : "Erro ao chamar API" },
            { status: 500 }
        );
    }
}
