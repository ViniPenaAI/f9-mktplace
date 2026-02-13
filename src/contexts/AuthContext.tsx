"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AuthProfile, AuthUser } from "@/types/auth";

interface AuthContextValue {
    user: AuthUser | null;
    profile: AuthProfile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
    refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [profile, setProfile] = useState<AuthProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchMe = useCallback(async () => {
        try {
            const res = await fetch("/api/auth/me");
            const data = await res.json();
            setUser(data.user ?? null);
            setProfile(data.profile ?? null);
        } catch {
            setUser(null);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMe();

        const supabase = createClient();
        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            fetchMe();
        });
        return () => subscription.unsubscribe();
    }, [fetchMe]);

    const signIn = useCallback(async (email: string, password: string) => {
        try {
            const supabase = createClient();
            const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
            if (error) return { error: error.message };
            await fetchMe();
            return { error: null };
        } catch (e) {
            return { error: e instanceof Error ? e.message : "Erro ao entrar." };
        }
    }, [fetchMe]);

    const signOut = useCallback(async () => {
        try {
            await fetch("/api/auth/logout");
            const supabase = createClient();
            await supabase.auth.signOut();
        } catch {
            // ignore
        }
        setUser(null);
        setProfile(null);
    }, []);

    const refresh = useCallback(() => fetchMe(), [fetchMe]);

    return (
        <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, refresh }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
    return ctx;
}
