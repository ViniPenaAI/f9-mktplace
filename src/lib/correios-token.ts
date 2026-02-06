/**
 * Token dos Correios (API nova com autenticação).
 * Uso: POST /v1/autentica com Authorization: Basic (usuário + senha Meu Correios).
 * O token é cacheado até perto do expiraEm (renovamos com margem de segurança).
 *
 * Quando você tiver a API REST de preço e prazo, use getCorreiosToken() e envie
 * no header: Authorization: Bearer <token>
 */

const TOKEN_RENEW_BEFORE_MS = 5 * 60 * 1000; // renovar 5 min antes de expirar

type TokenCache = {
    token: string;
    expiraEm: string;
    expiresAt: number;
};

declare global {
    // eslint-disable-next-line no-var
    var __correiosTokenCache: TokenCache | undefined;
}

function getCache(): TokenCache | undefined {
    if (typeof globalThis !== "undefined") return (globalThis as unknown as { __correiosTokenCache?: TokenCache }).__correiosTokenCache;
    return undefined;
}

function setCache(cache: TokenCache): void {
    if (typeof globalThis !== "undefined") (globalThis as unknown as { __correiosTokenCache?: TokenCache }).__correiosTokenCache = cache;
}

/**
 * Obtém um token válido (em cache ou novo). Requer no .env:
 * - CORREIOS_TOKEN_URL (ex: https://apihom.correios.com.br/token)
 * - CORREIOS_USER (usuário Meu Correios)
 * - CORREIOS_PASSWORD (senha / código de acesso)
 */
export async function getCorreiosToken(): Promise<string | null> {
    const baseUrl = process.env.CORREIOS_TOKEN_URL?.replace(/\/$/, "");
    const user = process.env.CORREIOS_USER;
    const password = process.env.CORREIOS_PASSWORD;

    if (!baseUrl || !user || !password) {
        return null;
    }

    const now = Date.now();
    const cached = getCache();
    if (cached && cached.expiresAt > now + TOKEN_RENEW_BEFORE_MS) {
        return cached.token;
    }

    const auth = Buffer.from(`${user}:${password}`).toString("base64");
    const url = `${baseUrl}/v1/autentica`;

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Basic ${auth}`,
                "Content-Type": "application/json",
            },
            signal: AbortSignal?.timeout?.(10000),
        });

        if (!res.ok) {
            const text = await res.text();
            console.warn("[Correios Token] Resposta não OK:", res.status, text?.slice(0, 200));
            return null;
        }

        const data = (await res.json()) as { token?: string; expiraEm?: string };
        const token = data.token;
        const expiraEm = data.expiraEm;

        if (!token) {
            console.warn("[Correios Token] Resposta sem campo token");
            return null;
        }

        let expiresAt = now + 60 * 60 * 1000; // fallback 1h
        if (expiraEm) {
            const parsed = new Date(expiraEm).getTime();
            if (!isNaN(parsed)) expiresAt = parsed;
        }

        setCache({ token, expiraEm: expiraEm || "", expiresAt });
        return token;
    } catch (err) {
        console.error("[Correios Token] Erro ao obter token:", err instanceof Error ? err.message : err);
        return null;
    }
}

/**
 * Limpa o cache do token (útil para forçar renovação em testes).
 */
export function clearCorreiosTokenCache(): void {
    if (typeof globalThis !== "undefined") (globalThis as unknown as { __correiosTokenCache?: TokenCache }).__correiosTokenCache = undefined;
}
