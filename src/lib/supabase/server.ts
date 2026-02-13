import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Cria cliente Supabase para uso em Server Components e Route Handlers.
 * Usa os cookies do next/headers para ler a sessão.
 * O middleware deve fazer o refresh da sessão e setar cookies.
 */
export async function createSupabaseServer() {
    const cookieStore = await cookies();
    const getAll = () => cookieStore.getAll().map((c) => ({ name: c.name, value: c.value }));
    const setAll = (_list: { name: string; value: string; options: Record<string, unknown> }[]) => {
        // Em Route Handlers não é possível setar cookies; o middleware faz o refresh.
    };
    return createServerClient(url, anonKey, {
        cookies: { getAll, setAll },
    });
}

/** Retorna o usuário auth atual (a partir dos cookies). */
export async function getAuthUser() {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    return user ?? null;
}

