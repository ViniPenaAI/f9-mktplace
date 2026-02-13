"use client";

import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Cliente Supabase para uso no browser (Auth: signIn, signUp, signOut, session). */
export function createClient() {
    if (!url || !anonKey) {
        throw new Error("NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórios para Auth.");
    }
    return createBrowserClient(url, anonKey);
}
