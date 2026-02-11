import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

type PayerInput = {
    first_name: string;
    last_name: string;
    email: string;
    identification?: { type: string; number: string };
};

type OrderRequestBody = {
    amount: number;
    payment_method_id: string;
    token?: string;
    installments?: number;
    payer: PayerInput;
    external_reference?: string;
};

function onlyDigits(s: string): string {
    return (s || "").replace(/\D/g, "");
}

export async function POST(request: NextRequest) {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
        return NextResponse.json(
            { error: "MERCADO_PAGO_ACCESS_TOKEN não configurado" },
            { status: 500 }
        );
    }

    const tokenPreview = accessToken.slice(0, 15) + "..." + accessToken.slice(-6);
    console.log("[Mercado Pago Orders] Token em uso (preview):", tokenPreview);

    try {
        const body = (await request.json()) as OrderRequestBody;
        const { amount, payment_method_id, token, installments = 1, payer, external_reference: extRef } = body;

        if (typeof amount !== "number" || amount <= 0) {
            return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
        }

        if (!payer?.email) {
            return NextResponse.json(
                { error: "Email do pagador é obrigatório" },
                { status: 400 }
            );
        }

        const isCard = payment_method_id !== "pix";
        if (isCard && !token) {
            return NextResponse.json(
                { error: "Token do cartão é obrigatório para pagamento com cartão" },
                { status: 400 }
            );
        }

        const external_reference = (extRef || `f9-${Date.now()}`).replace(/[^a-zA-Z0-9-]/g, "").slice(0, 64) || `f9-${Date.now()}`;
        const idempotencyKey = randomUUID();
        const amountStr = amount.toFixed(2);

        const email = (payer.email || "").trim().toLowerCase();
        const sandboxEnv = process.env.MERCADO_PAGO_SANDBOX;
        const isSandbox =
            sandboxEnv === "true" ||
            sandboxEnv === "1" ||
            (sandboxEnv !== "false" && process.env.NODE_ENV !== "production");
        const emailForApi =
            isSandbox && !email.endsWith("@testuser.com")
                ? "test_user_f9@testuser.com"
                : email;
        if (isSandbox && emailForApi === "test_user_f9@testuser.com" && email !== emailForApi) {
            console.log("[Mercado Pago Orders] Sandbox: usando email de teste (pagador informou outro email).");
        }

        const payerBody: Record<string, unknown> = {
            email: emailForApi,
        };
        if (payer.first_name) payerBody.first_name = payer.first_name;
        if (payer.last_name) payerBody.last_name = payer.last_name;
        const cpf = payer.identification?.number ? onlyDigits(payer.identification.number) : "";
        if (cpf.length === 11) {
            payerBody.identification = { type: "CPF", number: cpf };
        }

        const orderBody: Record<string, unknown> = {
            type: "online",
            external_reference,
            total_amount: amountStr,
            payer: payerBody,
            transactions: {
                payments: [
                    {
                        amount: amountStr,
                        payment_method: isCard
                            ? {
                                id: payment_method_id,
                                type: "credit_card",
                                token,
                                installments: Math.max(1, Math.min(12, installments)),
                            }
                            : {
                                id: "pix",
                                type: "bank_transfer",
                            },
                    },
                ],
            },
        };

        const res = await fetch("https://api.mercadopago.com/v1/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
                "X-Idempotency-Key": idempotencyKey,
            },
            body: JSON.stringify(orderBody),
        });

        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

        if (!res.ok) {
            const errors = data.errors as Array<{ code?: string; message?: string; details?: unknown }> | undefined;
            const firstDetail = errors?.[0]?.details;
            const detailStr = firstDetail != null ? JSON.stringify(firstDetail) : "";
            const message =
                (errors?.[0]?.message as string) ||
                (data.message as string) ||
                (data.error as string) ||
                "Erro ao criar pedido.";
            console.error("[Mercado Pago Orders] Erro:", res.status, JSON.stringify(data, null, 2));
            return NextResponse.json(
                { error: detailStr ? `${message} (${detailStr})` : message },
                { status: res.status >= 500 ? 500 : res.status }
            );
        }

        const orderId = data.id as string;
        const status = data.status as string;
        const statusDetail = data.status_detail as string | undefined;
        const transactions = data.transactions as { payments?: Array<Record<string, unknown>> } | Array<Record<string, unknown>> | undefined;
        const paymentsArray: Array<Record<string, unknown>> | undefined = Array.isArray(transactions)
            ? transactions
            : transactions?.payments;
        const firstPayment = paymentsArray?.[0];
        const paymentMethod = firstPayment?.payment_method as Record<string, unknown> | undefined;
        const pointFromPayment = firstPayment?.point_of_interaction as
            | { transaction_data?: Record<string, unknown> }
            | undefined;
        const pointFromRoot = data.point_of_interaction as { transaction_data?: Record<string, unknown> } | undefined;
        const pointOfInteraction = pointFromPayment ?? pointFromRoot;
        const txData = pointOfInteraction?.transaction_data as
            | {
                  qr_code_base64?: string;
                  qr_code?: string;
                  ticket_url?: string;
                  digitable_line?: string;
              }
            | undefined;

        return NextResponse.json({
            order_id: orderId,
            status,
            status_detail: statusDetail,
            total_amount: data.total_amount,
            total_paid_amount: data.total_paid_amount,
            // Para PIX e boletos, o código e o QR vêm normalmente em point_of_interaction.transaction_data
            point_of_interaction: pointOfInteraction,
            qr_code_base64:
                (paymentMethod?.qr_code_base64 as string | undefined) ??
                txData?.qr_code_base64,
            qr_code:
                (paymentMethod?.qr_code as string | undefined) ??
                txData?.qr_code,
            ticket_url:
                (paymentMethod?.ticket_url as string | undefined) ??
                txData?.ticket_url,
            digitable_line:
                (paymentMethod?.digitable_line as string | undefined) ??
                txData?.digitable_line,
        });
    } catch (err: unknown) {
        console.error("[Mercado Pago Orders] Exceção:", err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Erro ao criar pedido." },
            { status: 500 }
        );
    }
}
