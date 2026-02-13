"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

function onlyDigits(s: string) {
    return s.replace(/\D/g, "");
}

export default function CadastroPage() {
    const router = useRouter();
    const { signIn } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [document, setDocument] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const emailTrim = email.trim().toLowerCase();
        if (!name.trim()) {
            setError("Nome é obrigatório.");
            return;
        }
        if (!emailTrim || !emailTrim.includes("@")) {
            setError("E-mail válido é obrigatório.");
            return;
        }
        if (password.length < 6) {
            setError("A senha deve ter no mínimo 6 caracteres.");
            return;
        }
        if (password !== confirmPassword) {
            setError("As senhas não coincidem.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: emailTrim,
                    password,
                    name: name.trim(),
                    phone: phone.trim() || undefined,
                    document: onlyDigits(document).slice(0, 14) || undefined,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(typeof data?.error === "string" ? data.error : "Erro ao cadastrar.");
                return;
            }
            const { error: signInError } = await signIn(emailTrim, password);
            if (signInError) {
                setError("Conta criada. Faça login com seu e-mail e senha.");
                return;
            }
            router.push("/perfil");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro de conexão. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-md mx-auto space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Cadastro</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="name">Nome completo *</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Seu nome"
                                    className="mt-1"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="email">E-mail *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="email@exemplo.com"
                                    className="mt-1"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="password">Senha *</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    className="mt-1"
                                    minLength={6}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="confirmPassword">Confirmar senha *</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Repita a senha"
                                    className="mt-1"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="phone">Telefone / WhatsApp</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="(11) 99999-9999"
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="document">CPF / CNPJ</Label>
                                <Input
                                    id="document"
                                    value={document}
                                    onChange={(e) => setDocument(onlyDigits(e.target.value).slice(0, 14))}
                                    placeholder="000.000.000-00"
                                    className="mt-1"
                                />
                            </div>

                            <p className="text-sm text-gray-600 rounded-lg bg-gray-100 p-3">
                                Após o cadastro, você poderá cadastrar seus endereços de entrega em <strong>Meu perfil</strong>.
                            </p>

                            {error && <p className="text-sm text-red-600">{error}</p>}
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Cadastrando…" : "Criar conta"}
                            </Button>
                        </form>
                        <p className="mt-4 text-center text-sm text-gray-600">
                            Já tem conta?{" "}
                            <Link href="/" className="text-f9-magenta hover:underline">Entrar</Link>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
