import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
    console.warn("[Supabase] NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados. Pedidos não serão persistidos.");
}

/** Cliente Supabase com permissão total (apenas para uso em API routes / server). */
export const supabaseAdmin = url && serviceRoleKey ? createClient(url, serviceRoleKey, { auth: { persistSession: false } }) : null;
