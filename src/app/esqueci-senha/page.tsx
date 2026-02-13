"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EsqueciSenhaPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const trimmed = email.trim().toLowerCase();
        if (!trimmed || !trimmed.includes("@")) {
            setError("Informe um e-mail válido.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: trimmed }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.error || "Erro ao enviar e-mail.");
                return;
            }
            setSent(true);
        } catch {
            setError("Erro de conexão. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-md mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Esqueci minha senha</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {sent ? (
                            <p className="text-sm text-gray-600">
                                Se este e-mail estiver cadastrado, você receberá um link para redefinir a senha. Verifique sua caixa de entrada e spam.
                            </p>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="email">E-mail</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="email@exemplo.com"
                                        className="mt-1"
                                        autoFocus
                                    />
                                </div>
                                {error && <p className="text-sm text-red-600">{error}</p>}
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Enviando…" : "Enviar link"}
                                </Button>
                            </form>
                        )}
                        <p className="mt-4 text-center">
                            <Link href="/" className="text-sm text-f9-magenta hover:underline">Voltar ao início</Link>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
