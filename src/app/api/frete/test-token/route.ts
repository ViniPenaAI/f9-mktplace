import { NextResponse } from "next/server";
import { cotarFreteMelhorEnvio } from "@/lib/frete/melhorEnvioClient";

export const runtime = "nodejs";

function getDiagnostico() {
    const isSandbox = process.env.MELHOR_ENVIO_SANDBOX === "true" || process.env.MELHOR_ENVIO_SANDBOX === "1";
    const baseUrl =
        process.env.MELHOR_ENVIO_BASE_URL ??
        (isSandbox ? "https://sandbox.melhorenvio.com.br" : "https://api.melhorenvio.com.br");
    const tokenVar = isSandbox ? "MELHOR_ENVIO_SANDBOX_TOKEN" : "MELHOR_ENVIO_TOKEN";
    const tokenSet = isSandbox
        ? !!(process.env.MELHOR_ENVIO_SANDBOX_TOKEN?.trim() || process.env.MELHOR_ENVIO_TOKEN?.trim())
        : !!process.env.MELHOR_ENVIO_TOKEN?.trim();
    return { baseUrl, isSandbox, tokenVar, tokenSet };
}

/**
 * GET /api/frete/test-token
 * Testa se o token está válido. Em erro 401, retorna diagnóstico (URL usada, ambiente) para conferir.
 */
export async function GET() {
    const diagnostico = getDiagnostico();
    try {
        const cepOrigem = process.env.CEP_ORIGEM ?? "01310100";
        const cepDestino = "20040020";
        await cotarFreteMelhorEnvio({
            cepOrigem,
            cepDestino,
            itens: [
                { pesoKg: 0.3, larguraCm: 16, alturaCm: 16, comprimentoCm: 16, valorDeclarado: 50 },
            ],
        });
        return NextResponse.json({ ok: true, message: "Token válido. Cotação retornou opções." });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const is401 = message.includes("401") || message.includes("Unauthenticated");
        return NextResponse.json(
            {
                ok: false,
                error: message,
                diagnostico: {
                    base_url: diagnostico.baseUrl,
                    sandbox: diagnostico.isSandbox,
                    variavel_token: diagnostico.tokenVar,
                    token_definido: diagnostico.tokenSet,
                },
                checklist_401: is401
                    ? [
                          "Token foi gerado no MESMO ambiente que base_url? (Sandbox: app-sandbox.melhorenvio.com.br → base sandbox; Produção: app.melhorenvio.com.br → base produção)",
                          "Token não expirou? (validade 30 dias – gere outro no painel)",
                          "Copiou o token inteiro, sem espaço no início/fim?",
                      ]
                    : undefined,
            },
            { status: is401 ? 401 : 500 }
        );
    }
}
