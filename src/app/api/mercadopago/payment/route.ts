import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";

const BRL = "BRL";

type PayerInput = {
    first_name: string;
    last_name: string;
    email: string;
    identification: { type: string; number: string };
    address?: {
        zip_code?: string;
        street_name?: string;
        street_number?: string;
        neighborhood?: string;
        city?: string;
        federal_unit?: string;
    };
};

type PaymentRequestBody = {
    amount: number;
    description: string;
    title?: string;
    payment_method_id: string;
    token?: string;
    issuer_id?: number;
    installments?: number;
    payer: PayerInput;
    external_reference?: string;
    date_of_expiration?: string; // para PIX/boleto
};

function onlyDigits(s: string): string {
    return (s || "").replace(/\D/g, "");
}

function buildIdempotencyKey(externalRef: string): string {
    return `f9_${externalRef}_${Date.now()}`;
}

/** Formato exigido pelo Mercado Pago: yyyy-MM-dd'T'HH:mm:ss.000-03:00 */
function formatDateOfExpiration(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hour = pad(date.getHours());
    const min = pad(date.getMinutes());
    const sec = pad(date.getSeconds());
    return `${year}-${month}-${day}T${hour}:${min}:${sec}.000-03:00`;
}

export async function POST(request: NextRequest) {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
        return NextResponse.json(
            { error: "MERCADO_PAGO_ACCESS_TOKEN não configurado" },
            { status: 500 }
        );
    }
    // Log só o início do token para conferir se está carregando o de teste (não expõe o token completo)
    const tokenPreview = accessToken.slice(0, 15) + "..." + accessToken.slice(-6);
    console.log("[Mercado Pago] Token em uso (preview):", tokenPreview);

    try {
        const body = (await request.json()) as PaymentRequestBody;
        const {
            amount,
            description,
            title,
            payment_method_id,
            token,
            issuer_id,
            installments = 1,
            payer,
            external_reference: extRef,
            date_of_expiration,
        } = body;

        if (typeof amount !== "number" || amount <= 0) {
            return NextResponse.json(
                { error: "Valor inválido" },
                { status: 400 }
            );
        }

        if (!payer?.email || !payer?.first_name || !payer?.last_name) {
            return NextResponse.json(
                { error: "Dados do pagador incompletos (nome, sobrenome, email)" },
                { status: 400 }
            );
        }

        const cpfDigits = onlyDigits(payer.identification?.number || "");
        if (payment_method_id === "pix" && cpfDigits.length !== 11) {
            return NextResponse.json(
                { error: "CPF inválido. Informe os 11 dígitos do CPF para pagamento com PIX." },
                { status: 400 }
            );
        }

        const isCard = payment_method_id !== "pix" && payment_method_id !== "bolbradesco";
        if (isCard && !token) {
            return NextResponse.json(
                { error: "Token do cartão é obrigatório para pagamento com cartão" },
                { status: 400 }
            );
        }

        const external_reference = extRef || `f9_${Date.now()}`;
        const idempotencyKey = buildIdempotencyKey(external_reference);

        const client = new MercadoPagoConfig({
            accessToken,
            options: { timeout: 15000, idempotencyKey },
        });
        const paymentClient = new Payment(client);

        const itemTitle = title || description?.substring(0, 100) || "Pedido F9";
        const paymentBody: Record<string, unknown> = {
            transaction_amount: Number(amount.toFixed(2)),
            description: description?.substring(0, 255) || "Pedido F9",
            payment_method_id,
            external_reference,
            metadata: { order_number: external_reference },
            statement_descriptor: "F9",
            payer: {
                first_name: payer.first_name.substring(0, 255),
                last_name: payer.last_name.substring(0, 255),
                email: payer.email,
                identification: {
                    type: payer.identification?.type || "CPF",
                    number: onlyDigits(payer.identification?.number || ""),
                },
                ...(payer.address && {
                    address: {
                        zip_code: onlyDigits(payer.address.zip_code || "").substring(0, 8),
                        street_name: payer.address.street_name,
                        street_number: String(payer.address.street_number || ""),
                        neighborhood: payer.address.neighborhood,
                        city: payer.address.city,
                        federal_unit: payer.address.federal_unit,
                    },
                }),
            },
            additional_info: {
                items: [
                    {
                        id: "pedido-f9",
                        title: itemTitle.substring(0, 256),
                        description: (description || "Pedido F9").substring(0, 256),
                        quantity: 1,
                        unit_price: Number(amount.toFixed(2)),
                    },
                ],
                payer: {
                    first_name: payer.first_name,
                    last_name: payer.last_name,
                    ...(payer.address && {
                        address: {
                            zip_code: payer.address.zip_code,
                            street_name: payer.address.street_name,
                            street_number: payer.address.street_number,
                        },
                    }),
                },
            },
        };

        if (isCard) {
            (paymentBody as Record<string, unknown>).token = token;
            (paymentBody as Record<string, unknown>).installments = Math.max(1, Math.min(12, installments));
            (paymentBody as Record<string, unknown>).capture = true;
            if (issuer_id) (paymentBody as Record<string, unknown>).issuer_id = String(issuer_id);
        }

        if (payment_method_id === "pix") {
            const exp = date_of_expiration || formatDateOfExpiration(new Date(Date.now() + 24 * 60 * 60 * 1000));
            (paymentBody as Record<string, unknown>).date_of_expiration = exp;
        }

        if (payment_method_id === "bolbradesco") {
            const exp = date_of_expiration || formatDateOfExpiration(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));
            (paymentBody as Record<string, unknown>).date_of_expiration = exp;
        }

        const result = await paymentClient.create({
            body: paymentBody as Parameters<typeof paymentClient.create>[0]["body"],
        });

        const payment = result as unknown as {
            id?: number;
            status?: string;
            status_detail?: string;
            point_of_interaction?: {
                transaction_data?: {
                    ticket_url?: string;
                    qr_code_base64?: string;
                    qr_code?: string;
                };
            };
            transaction_details?: { external_resource_url?: string; barcode?: string; digitable_line?: string };
        };

        return NextResponse.json({
            payment_id: payment.id,
            status: payment.status,
            status_detail: payment.status_detail,
            point_of_interaction: payment.point_of_interaction,
            transaction_details: payment.transaction_details,
        });
    } catch (err: unknown) {
        const errJson = err && typeof err === "object" ? JSON.stringify(err, null, 2) : String(err);
        console.error("[Mercado Pago] Resposta de erro completa:", errJson);

        let errorMessage = "Erro ao processar pagamento. Tente novamente.";

        if (err && typeof err === "object") {
            const obj = err as Record<string, unknown>;
            if (typeof obj.message === "string" && obj.message) errorMessage = obj.message;
            if (obj.cause && typeof obj.cause === "object" && typeof (obj.cause as Record<string, unknown>).message === "string") {
                const causeMsg = (obj.cause as Record<string, unknown>).message as string;
                if (causeMsg) errorMessage = causeMsg;
            }
            if (Array.isArray(obj.cause)) {
                const first = obj.cause[0];
                if (first && typeof first === "object") {
                    const f = first as Record<string, unknown>;
                    if (typeof f.message === "string" && f.message) errorMessage = f.message;
                    else if (typeof f.description === "string" && f.description) errorMessage = f.description;
                }
            }
            if (Array.isArray(obj.error) && obj.error.length > 0) {
                const first = obj.error[0];
                if (typeof first === "string") errorMessage = first;
                else if (first && typeof first === "object" && "message" in first) errorMessage = String((first as { message: unknown }).message);
            }
        }

        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
