import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const SANDBOX_URL = "https://sandbox.melhorenvio.com.br";
const PRODUCTION_URL = "https://melhorenvio.com.br";

/** Scopes: cotação, etiqueta, checkout, impressão + ecommerce-shipping (cotação e compra para loja). */
const SCOPES = [
    "shipping-calculate",
    "shipping-generate",
    "shipping-checkout",
    "shipping-print",
    "ecommerce-shipping",
].join(" ");

/**
 * GET /api/frete/oauth/authorize
 * Redireciona o usuário para o Melhor Envio autorizar o app.
 * Requer no .env: MELHOR_ENVIO_CLIENT_ID (ou MELHOR_ENVIO_SANDBOX_CLIENT_ID), redirect_uri cadastrada no app.
 */
export async function GET(request: NextRequest) {
    const isSandbox = process.env.MELHOR_ENVIO_SANDBOX === "true" || process.env.MELHOR_ENVIO_SANDBOX === "1";
    const clientId = isSandbox
        ? (process.env.MELHOR_ENVIO_SANDBOX_CLIENT_ID ?? process.env.MELHOR_ENVIO_CLIENT_ID)
        : process.env.MELHOR_ENVIO_CLIENT_ID;
    const baseUrl = isSandbox ? SANDBOX_URL : PRODUCTION_URL;

    if (!clientId?.trim()) {
        return NextResponse.json(
            {
                error: "Configure MELHOR_ENVIO_CLIENT_ID (ou MELHOR_ENVIO_SANDBOX_CLIENT_ID para sandbox). Crie um app em: app-sandbox.melhorenvio.com.br ou app.melhorenvio.com.br → Integrações → Área dev.",
            },
            { status: 400 }
        );
    }

    const redirectUri = process.env.MELHOR_ENVIO_REDIRECT_URI ?? request.nextUrl.origin + "/api/frete/oauth/callback";
    const state = crypto.randomUUID();
    const cookieStore = await cookies();
    cookieStore.set("me_oauth_state", state, { httpOnly: true, sameSite: "lax", maxAge: 600, path: "/" });

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        state,
        scope: SCOPES,
    });
    const authorizeUrl = `${baseUrl}/oauth/authorize?${params.toString()}`;
    return NextResponse.redirect(authorizeUrl);
}
