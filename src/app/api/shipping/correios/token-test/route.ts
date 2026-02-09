import { NextResponse } from "next/server";
import { getCorreiosToken } from "@/lib/correios-token";

/**
 * GET /api/shipping/correios/token-test
 * Testa se as credenciais dos Correios (CORREIOS_TOKEN_URL, USER, PASSWORD) estão corretas.
 * Retorna { ok: true } se o token foi obtido, ou { ok: false, error } caso contrário.
 */
export async function GET() {
    const token = await getCorreiosToken();
    if (token) {
        return NextResponse.json({ ok: true, message: "Token obtido com sucesso." });
    }
    const hasEnv = !!(
        process.env.CORREIOS_TOKEN_URL &&
        process.env.CORREIOS_USER &&
        process.env.CORREIOS_PASSWORD
    );
    return NextResponse.json(
        {
            ok: false,
            error: hasEnv
                ? "Não foi possível obter o token. Verifique usuário e senha no .env."
                : "Configure CORREIOS_TOKEN_URL, CORREIOS_USER e CORREIOS_PASSWORD no .env.",
        },
        { status: hasEnv ? 401 : 400 }
    );
}
