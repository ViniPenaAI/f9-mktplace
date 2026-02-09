import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const SANDBOX_URL = "https://sandbox.melhorenvio.com.br";
const PRODUCTION_URL = "https://melhorenvio.com.br";

/**
 * GET /api/frete/oauth/callback?code=...&state=...
 * Recebe o code do Melhor Envio, troca por access_token e exibe para copiar no .env.
 */
export async function GET(request: NextRequest) {
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const errorParam = request.nextUrl.searchParams.get("error");

    if (errorParam) {
        return htmlResponse(
            400,
            `Erro na autorização: ${errorParam}. ${request.nextUrl.searchParams.get("error_description") || ""}`,
            null
        );
    }
    if (!code?.trim()) {
        return htmlResponse(400, "Parâmetro code não recebido. Refaça o fluxo a partir de /api/frete/oauth/authorize", null);
    }

    const cookieStore = await cookies();
    const savedState = cookieStore.get("me_oauth_state")?.value;
    cookieStore.delete("me_oauth_state");
    if (savedState && state !== savedState) {
        return htmlResponse(400, "State inválido. Refaça o fluxo a partir de /api/frete/oauth/authorize", null);
    }

    const isSandbox = process.env.MELHOR_ENVIO_SANDBOX === "true" || process.env.MELHOR_ENVIO_SANDBOX === "1";
    const clientId = isSandbox
        ? (process.env.MELHOR_ENVIO_SANDBOX_CLIENT_ID ?? process.env.MELHOR_ENVIO_CLIENT_ID)
        : process.env.MELHOR_ENVIO_CLIENT_ID;
    const clientSecret = isSandbox
        ? (process.env.MELHOR_ENVIO_SANDBOX_CLIENT_SECRET ?? process.env.MELHOR_ENVIO_CLIENT_SECRET)
        : process.env.MELHOR_ENVIO_CLIENT_SECRET;
    const baseUrl = isSandbox ? SANDBOX_URL : PRODUCTION_URL;
    const redirectUri = process.env.MELHOR_ENVIO_REDIRECT_URI ?? request.nextUrl.origin + "/api/frete/oauth/callback";

    if (!clientId?.trim() || !clientSecret?.trim()) {
        return htmlResponse(
            500,
            "Configure MELHOR_ENVIO_CLIENT_ID e MELHOR_ENVIO_CLIENT_SECRET (ou versões SANDBOX) no .env.local",
            null
        );
    }

    const body = new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId.trim(),
        client_secret: clientSecret.trim(),
        redirect_uri: redirectUri.trim(),
        code: code.trim(),
    });

    // Doc Melhor Envio: User-Agent é obrigatório ("Aplicação (email para contato técnico)")
    const userAgent = process.env.MELHOR_ENVIO_USER_AGENT ?? "F9 Marketplace (contato@f9.com.br)";

    const res = await fetch(`${baseUrl}/oauth/token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
            "User-Agent": userAgent,
        },
        body: body.toString(),
        signal: AbortSignal.timeout(15000),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const isInvalidClient =
            res.status === 401 || String(data?.error).toLowerCase().includes("invalid_client");
        const debugHtml = isInvalidClient
            ? `<p><strong>Diagnóstico (invalid_client):</strong></p><ul>
<li><strong>redirect_uri</strong> que estamos enviando: <code>${escapeHtml(redirectUri)}</code><br>Ela precisa ser <strong>exatamente igual</strong> à cadastrada no app no Melhor Envio (incluindo https, domínio e sem barra no final).</li>
<li><strong>Ambiente:</strong> ${isSandbox ? "Sandbox" : "Produção"} (API: ${escapeHtml(baseUrl)})</li>
<li><strong>client_id</strong> definido nas variáveis de ambiente: ${clientId ? "sim" : "não"}</li>
<li><strong>client_secret</strong> definido: ${clientSecret ? "sim" : "não"}</li>
<li>No Vercel: Project → Settings → Environment Variables. Confira <code>MELHOR_ENVIO_SANDBOX</code>=true, <code>MELHOR_ENVIO_SANDBOX_CLIENT_ID</code> e <code>MELHOR_ENVIO_SANDBOX_CLIENT_SECRET</code> (valores do app em app-sandbox.melhorenvio.com.br).</li>
<li>Defina <code>MELHOR_ENVIO_REDIRECT_URI</code> com a mesma URL do item 1 (ex.: <code>https://seu-dominio.vercel.app/api/frete/oauth/callback</code>).</li>
</ul>`
            : "";
        return htmlErrorResponse(res.status, `Falha ao trocar code por token: ${res.status}. ${JSON.stringify(data)}`, debugHtml);
    }

    const accessToken = data.access_token ?? data.token;
    const refreshToken = data.refresh_token;
    if (!accessToken) {
        return htmlResponse(500, "Resposta sem access_token. " + JSON.stringify(data), null);
    }

    const envVar = isSandbox ? "MELHOR_ENVIO_SANDBOX_TOKEN" : "MELHOR_ENVIO_TOKEN";
    const refreshVar = isSandbox ? "MELHOR_ENVIO_SANDBOX_REFRESH_TOKEN" : "MELHOR_ENVIO_REFRESH_TOKEN";
    return htmlResponse(200, null, {
        accessToken,
        refreshToken: refreshToken ?? "",
        envVar,
        refreshVar,
        expiresIn: data.expires_in,
    });
}

function htmlErrorResponse(status: number, errorMessage: string, debugHtml: string) {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Erro OAuth Melhor Envio</title></head><body style="font-family:sans-serif;max-width:640px;margin:2rem auto;padding:1rem;"><h1>Erro</h1><p>${escapeHtml(errorMessage)}</p>${debugHtml}<p><a href="/api/frete/oauth/authorize">Tentar novamente</a></p></body></html>`;
    return new NextResponse(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function htmlResponse(
    status: number,
    error: string | null,
    tokens: { accessToken: string; refreshToken: string; envVar: string; refreshVar: string; expiresIn?: number } | null
) {
    const html = error
        ? `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Erro OAuth Melhor Envio</title></head><body style="font-family:sans-serif;max-width:600px;margin:2rem auto;padding:1rem;"><h1>Erro</h1><p>${escapeHtml(error)}</p><p><a href="/api/frete/oauth/authorize">Tentar novamente</a></p></body></html>`
        : `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Token Melhor Envio</title></head>
<body style="font-family:sans-serif;max-width:720px;margin:2rem auto;padding:1rem;">
<h1>Token obtido</h1>
<p>Copie o valor abaixo para o seu <code>.env.local</code>:</p>
<p><strong>${escapeHtml(tokens!.envVar)}</strong></p>
<textarea readonly style="width:100%;height:80px;font-size:12px;">${escapeHtml(tokens!.accessToken)}</textarea>
<p>No .env.local:</p>
<pre style="background:#f0f0f0;padding:1rem;overflow:auto;">${escapeHtml(tokens!.envVar)}=COLE_O_TOKEN_ACIMA_AQUI</pre>
${tokens!.refreshToken ? `<p><strong>Refresh token</strong> (opcional; use para renovar em 30 dias):</p><textarea readonly style="width:100%;height:60px;font-size:12px;">${escapeHtml(tokens!.refreshToken)}</textarea><p>Variável: <code>${escapeHtml(tokens!.refreshVar)}</code></p>` : ""}
${tokens!.expiresIn ? `<p><small>Validade: ${tokens!.expiresIn} segundos (~30 dias). Após isso, use o refresh token ou refaça a autorização.</small></p>` : ""}
<p><a href="/api/frete/test-token">Testar token</a></p>
</body></html>`;
    return new NextResponse(html, {
        status,
        headers: { "Content-Type": "text/html; charset=utf-8" },
    });
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
