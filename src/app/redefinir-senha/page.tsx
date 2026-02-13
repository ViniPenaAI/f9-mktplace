"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RedefinirSenhaPage() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [hasToken, setHasToken] = useState<boolean | null>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const hash = window.location.hash;
        const search = window.location.search;
        const hashParams = new URLSearchParams(hash.replace("#", ""));
        const searchParams = new URLSearchParams(search);

        // 1) Token no hash (fluxo implícito): access_token + type=recovery
        const accessToken = hashParams.get("access_token");
        const typeHash = hashParams.get("type");
        if (typeHash === "recovery" && accessToken) {
            setHasToken(true);
            return;
        }

        // 2) Token na query (Supabase envia token_hash após clicar no e-mail)
        const tokenHash = searchParams.get("token_hash");
        const typeQuery = searchParams.get("type");
        if (tokenHash && (typeQuery === "recovery" || typeQuery === "password_recovery")) {
            const supabase = createClient();
            supabase.auth
                .verifyOtp({ token_hash: tokenHash, type: "recovery" })
                .then(({ error: err }) => {
                    setHasToken(!err);
                    if (!err) {
                        window.history.replaceState(null, "", window.location.pathname);
                    }
                })
                .catch(() => setHasToken(false));
            return;
        }

        // 3) PKCE: code na query
        const code = searchParams.get("code");
        if (code) {
            const supabase = createClient();
            supabase.auth
                .exchangeCodeForSession(code)
                .then(({ error: err }) => {
                    setHasToken(!err);
                    if (!err) {
                        window.history.replaceState(null, "", window.location.pathname);
                    }
                })
                .catch(() => setHasToken(false));
            return;
        }

        setHasToken(false);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (password.length < 6) {
            setError("A senha deve ter no mínimo 6 caracteres.");
            return;
        }
        if (password !== confirm) {
            setError("As senhas não coincidem.");
            return;
        }
        setLoading(true);
        try {
            const supabase = createClient();
            const { error: err } = await supabase.auth.updateUser({ password });
            if (err) {
                setError(err.message);
                return;
            }
            setSuccess(true);
            setTimeout(() => router.push("/"), 2000);
        } catch {
            setError("Erro ao redefinir a senha.");
        } finally {
            setLoading(false);
        }
    };

    if (hasToken === null) {
        return (
            <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <p className="text-sm text-gray-600 text-center">Verificando link…</p>
                    </CardContent>
                </Card>
            </main>
        );
    }

    if (!hasToken && !success) {
        return (
            <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Link inválido ou expirado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600 mb-4">
                            Use o link que enviamos por e-mail para redefinir sua senha. Se não recebeu, solicite novamente em &quot;Esqueci minha senha&quot;.
                        </p>
                        <Button variant="outline" onClick={() => router.push("/")}>
                            Voltar ao início
                        </Button>
                    </CardContent>
                </Card>
            </main>
        );
    }

    if (success) {
        return (
            <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
                <Card className="w-full max-w-md border-green-200 bg-green-50/50">
                    <CardContent className="pt-6">
                        <p className="font-medium text-green-800">Senha redefinida com sucesso. Redirecionando...</p>
                    </CardContent>
                </Card>
            </main>
        );
    }

    return (
        <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Nova senha</CardTitle>
                    <p className="text-sm text-gray-500">Digite e confirme sua nova senha.</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="password">Nova senha</Label>
                            <Input
                                id="password"
                                type="password"
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1"
                                minLength={6}
                            />
                        </div>
                        <div>
                            <Label htmlFor="confirm">Confirmar senha</Label>
                            <Input
                                id="confirm"
                                type="password"
                                autoComplete="new-password"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                className="mt-1"
                            />
                        </div>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Salvando…" : "Redefinir senha"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}
