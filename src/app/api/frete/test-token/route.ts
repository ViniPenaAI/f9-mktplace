import { NextResponse } from "next/server";
import { cotarFreteMelhorEnvio } from "@/lib/frete/melhorEnvioClient";

export const runtime = "nodejs";

function getDiagnostico() {
    const isSandbox = process.env.MELHOR_ENVIO_SANDBOX === "true" || process.env.MELHOR_ENVIO_SANDBOX === "1";
    let baseUrl =
        process.env.MELHOR_ENVIO_BASE_URL ??
        (isSandbox ? "https://sandbox.melhorenvio.com.br" : "https://api.melhorenvio.com.br");
    if (baseUrl.includes("app.melhorenvio.com.br") && !baseUrl.includes("app-sandbox")) {
        baseUrl = "https://api.melhorenvio.com.br";
    }
    if (baseUrl.includes("app-sandbox.melhorenvio.com.br")) {
        baseUrl = "https://sandbox.melhorenvio.com.br";
    }
    const tokenVar = isSandbox ? "MELHOR_ENVIO_SANDBOX_TOKEN" : "MELHOR_ENVIO_TOKEN";
    const tokenSet = isSandbox
        ? !!(process.env.MELHOR_ENVIO_SANDBOX_TOKEN?.trim() || process.env.MELHOR_ENVIO_TOKEN?.trim())
        : !!process.env.MELHOR_ENVIO_TOKEN?.trim();
    const useMockEnv =
        process.env.MELHOR_ENVIO_MOCK === "1" || process.env.MELHOR_ENVIO_MOCK === "true";
    return { baseUrl, isSandbox, tokenVar, tokenSet, useMockEnv };
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
            itens: [{ pesoKg: 0.3, larguraCm: 16, alturaCm: 16, comprimentoCm: 16, valorDeclarado: 50 }],
        });
        console.log("[/api/frete/test-token] Sucesso na cotação Melhor Envio", {
            base_url: diagnostico.baseUrl,
            sandbox: diagnostico.isSandbox,
            use_mock_env: diagnostico.useMockEnv,
        });
        return NextResponse.json({
            ok: true,
            message: "Token válido. Cotação retornou opções.",
            diagnostico: {
                base_url: diagnostico.baseUrl,
                sandbox: diagnostico.isSandbox,
                variavel_token: diagnostico.tokenVar,
                token_definido: diagnostico.tokenSet,
                use_mock_env: diagnostico.useMockEnv,
            },
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const is401 = message.includes("401") || message.includes("Unauthenticated");
        const isHtmlResponse = message.includes("<!DOCTYPE") || message.includes("is not valid JSON");
        console.error("[/api/frete/test-token] Erro ao testar token Melhor Envio", {
            message,
            base_url: diagnostico.baseUrl,
            sandbox: diagnostico.isSandbox,
            use_mock_env: diagnostico.useMockEnv,
        });
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
                ...(isHtmlResponse && {
                    dica: "A API retornou HTML em vez de JSON. Use MELHOR_ENVIO_BASE_URL=https://api.melhorenvio.com.br (produção) ou remova a variável. Não use app.melhorenvio.com.br (é o painel, não a API).",
                }),
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
