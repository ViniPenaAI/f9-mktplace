import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

export async function POST(request: NextRequest) {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
        return NextResponse.json(
            { error: "MERCADO_PAGO_ACCESS_TOKEN não configurado" },
            { status: 500 }
        );
    }

    try {
        const body = await request.json();
        const { amount, description, title = "Pedido F9" } = body as {
            amount: number;
            description?: string;
            title?: string;
        };

        if (typeof amount !== "number" || amount <= 0) {
            return NextResponse.json(
                { error: "Valor inválido" },
                { status: 400 }
            );
        }

        const client = new MercadoPagoConfig({
            accessToken,
            options: { timeout: 5000 },
        });
        const preference = new Preference(client);

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

        const preferenceBody = {
            items: [
                {
                    id: "pedido-f9",
                    title: title.substring(0, 256),
                    description: description?.substring(0, 256) || "Pedido via Configurador F9",
                    quantity: 1,
                    unit_price: Number(amount.toFixed(2)),
                },
            ],
            back_urls: {
                success: `${baseUrl}/?payment=success`,
                failure: `${baseUrl}/?payment=failure`,
                pending: `${baseUrl}/?payment=pending`,
            },
            auto_return: "approved" as const,
            statement_descriptor: "F9",
        };

        const result = await preference.create({ body: preferenceBody });

        const initPoint = result.init_point ?? result.sandbox_init_point;
        if (!initPoint) {
            return NextResponse.json(
                { error: "Resposta do Mercado Pago sem link de checkout" },
                { status: 500 }
            );
        }

        return NextResponse.json({ init_point: initPoint, preference_id: result.id });
    } catch (err) {
        console.error("Erro ao criar preferência Mercado Pago:", err);
        return NextResponse.json(
            { error: "Erro ao criar checkout. Tente novamente." },
            { status: 500 }
        );
    }
}
