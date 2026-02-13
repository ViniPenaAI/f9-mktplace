import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SANDBOX_URL = "https://sandbox.melhorenvio.com.br";
const PRODUCTION_URL = "https://melhorenvio.com.br";

/**
 * GET /api/frete/oauth/refresh
 * Renova o access_token usando o refresh_token (válido 45 dias).
 * Útil quando o access_token expira em 30 dias – chame esta rota e atualize MELHOR_ENVIO_TOKEN no .env.
 */
export async function GET() {
    const isSandbox = process.env.MELHOR_ENVIO_SANDBOX === "true" || process.env.MELHOR_ENVIO_SANDBOX === "1";
    const clientId = isSandbox
        ? (process.env.MELHOR_ENVIO_SANDBOX_CLIENT_ID ?? process.env.MELHOR_ENVIO_CLIENT_ID)
        : process.env.MELHOR_ENVIO_CLIENT_ID;
    const clientSecret = isSandbox
        ? (process.env.MELHOR_ENVIO_SANDBOX_CLIENT_SECRET ?? process.env.MELHOR_ENVIO_CLIENT_SECRET)
        : process.env.MELHOR_ENVIO_CLIENT_SECRET;
    const refreshToken = isSandbox
        ? (process.env.MELHOR_ENVIO_SANDBOX_REFRESH_TOKEN ?? process.env.MELHOR_ENVIO_REFRESH_TOKEN)
        : process.env.MELHOR_ENVIO_REFRESH_TOKEN;
    const baseUrl = isSandbox ? SANDBOX_URL : PRODUCTION_URL;
    const userAgent = process.env.MELHOR_ENVIO_USER_AGENT ?? "F9 Marketplace (contato@f9.com.br)";

    if (!clientId?.trim() || !clientSecret?.trim() || !refreshToken?.trim()) {
        return html(
            400,
            "Configure MELHOR_ENVIO_CLIENT_ID, MELHOR_ENVIO_CLIENT_SECRET e MELHOR_ENVIO_REFRESH_TOKEN (ou versões SANDBOX) no .env."
        );
    }

    const body = new URLSearchParams({
        grant_type: "refresh_token",
        client_id: clientId.trim(),
        client_secret: clientSecret.trim(),
        refresh_token: refreshToken.trim(),
    });

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
        return html(res.status, `Falha ao renovar token: ${res.status}. ${JSON.stringify(data)}`);
    }

    const accessToken = data.access_token ?? data.token;
    const newRefreshToken = data.refresh_token ?? refreshToken;
    if (!accessToken) {
        return html(500, "Resposta sem access_token. " + JSON.stringify(data));
    }

    const envVar = isSandbox ? "MELHOR_ENVIO_SANDBOX_TOKEN" : "MELHOR_ENVIO_TOKEN";
    const refreshVar = isSandbox ? "MELHOR_ENVIO_SANDBOX_REFRESH_TOKEN" : "MELHOR_ENVIO_REFRESH_TOKEN";
    const expiresIn = data.expires_in;

    const htmlContent = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Token renovado - Melhor Envio</title></head>
<body style="font-family:sans-serif;max-width:720px;margin:2rem auto;padding:1rem;">
<h1>Token renovado</h1>
<p>Atualize no .env.local e no Vercel (Environment Variables):</p>
<p><strong>${envVar}</strong></p>
<textarea readonly style="width:100%;height:80px;font-size:12px;">${escapeHtml(accessToken)}</textarea>
<p><strong>${refreshVar}</strong> (guarde para a próxima renovação):</p>
<textarea readonly style="width:100%;height:60px;font-size:12px;">${escapeHtml(newRefreshToken)}</textarea>
${expiresIn ? `<p><small>Novo access_token válido por ${expiresIn} segundos (~30 dias).</small></p>` : ""}
<p><a href="/api/frete/test-token">Testar token</a> · <a href="/api/frete/oauth/authorize">Nova autorização</a></p>
</body></html>`;

    return new NextResponse(htmlContent, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
    });
}

function html(status: number, message: string) {
    const content = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Erro</title></head><body style="font-family:sans-serif;max-width:600px;margin:2rem auto;padding:1rem;"><h1>Erro</h1><p>${escapeHtml(message)}</p><p><a href="/api/frete/oauth/refresh">Tentar novamente</a></p></body></html>`;
    return new NextResponse(content, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function escapeHtml(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
