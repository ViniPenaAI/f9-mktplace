"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { MapPin, Plus, Pencil, Trash2, Loader2 } from "lucide-react";

function onlyDigits(s: string) {
    return s.replace(/\D/g, "");
}

type Address = {
    id: string;
    label: string | null;
    zip_code: string;
    street: string;
    number: string;
    complement: string | null;
    neighborhood: string | null;
    city: string;
    state: string;
};

const emptyAddressForm = {
    label: "",
    zip_code: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
};

export default function PerfilPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, profile, loading: authLoading, refresh } = useAuth();
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [document, setDocument] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [editingProfile, setEditingProfile] = useState(false);

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loadingAddresses, setLoadingAddresses] = useState(true);
    const [addressDialogOpen, setAddressDialogOpen] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
    const [addressForm, setAddressForm] = useState(emptyAddressForm);
    const [addressSaving, setAddressSaving] = useState(false);
    const [addressError, setAddressError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [cepLoading, setCepLoading] = useState(false);
    const [addressesFlash, setAddressesFlash] = useState<string | null>(null);

    useEffect(() => {
        const later = searchParams.get("addresses_later");
        const partial = searchParams.get("partial_addresses");
        if (later === "1") {
            setAddressesFlash("Você pode cadastrar seus endereços de entrega abaixo quando quiser.");
            router.replace("/perfil", { scroll: false });
        } else if (partial === "1") {
            setAddressesFlash("Alguns endereços não puderam ser salvos. Você pode adicionar mais abaixo.");
            router.replace("/perfil", { scroll: false });
        }
    }, [searchParams, router]);

    useEffect(() => {
        if (!addressesFlash) return;
        const t = setTimeout(() => setAddressesFlash(null), 8000);
        return () => clearTimeout(t);
    }, [addressesFlash]);

    useEffect(() => {
        if (profile) {
            setName(profile.name ?? "");
            setPhone(profile.phone ?? "");
            setDocument(profile.document ?? "");
        }
    }, [profile]);

    const fetchAddresses = useCallback(async () => {
        if (!user) return;
        setLoadingAddresses(true);
        try {
            const res = await fetch("/api/user/addresses");
            const data = await res.json();
            if (res.ok && Array.isArray(data?.addresses)) {
                setAddresses(data.addresses);
            }
        } catch {
            setAddresses([]);
        } finally {
            setLoadingAddresses(false);
        }
    }, [user]);

    useEffect(() => {
        fetchAddresses();
    }, [fetchAddresses]);

    if (authLoading) {
        return (
            <main className="min-h-screen bg-gray-50 py-12 px-4">
                <div className="max-w-md mx-auto text-center text-gray-500">Carregando…</div>
            </main>
        );
    }
    if (!user) {
        router.replace("/");
        return null;
    }

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        if (!name.trim()) {
            setError("Nome é obrigatório.");
            return;
        }
        setSaving(true);
        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    phone: phone.trim() || null,
                    document: onlyDigits(document).slice(0, 14) || null,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.error || "Erro ao salvar.");
                return;
            }
            await refresh();
            setSuccess(true);
            setEditingProfile(false);
        } catch {
            setError("Erro de conexão. Tente novamente.");
        } finally {
            setSaving(false);
        }
    };

    const fetchCep = async (cep: string) => {
        const digits = onlyDigits(cep);
        if (digits.length !== 8) return;
        setCepLoading(true);
        try {
            const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
            const data = await res.json();
            if (!data.erro) {
                setAddressForm((f) => ({
                    ...f,
                    street: data.logradouro || f.street,
                    neighborhood: data.bairro || f.neighborhood,
                    city: data.localidade || f.city,
                    state: data.uf || f.state,
                }));
            }
        } catch {
            // ignore
        } finally {
            setCepLoading(false);
        }
    };

    const openNewAddress = () => {
        setEditingAddressId(null);
        setAddressForm(emptyAddressForm);
        setAddressError(null);
        setAddressDialogOpen(true);
    };

    const openEditAddress = (addr: Address) => {
        setEditingAddressId(addr.id);
        setAddressForm({
            label: addr.label ?? "",
            zip_code: addr.zip_code?.replace(/\D/g, "") ?? "",
            street: addr.street ?? "",
            number: addr.number ?? "",
            complement: addr.complement ?? "",
            neighborhood: addr.neighborhood ?? "",
            city: addr.city ?? "",
            state: addr.state ?? "",
        });
        setAddressError(null);
        setAddressDialogOpen(true);
    };

    const handleAddressSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddressError(null);
        const zip = onlyDigits(addressForm.zip_code).slice(0, 8);
        if (zip.length !== 8 || !addressForm.street?.trim() || !addressForm.number?.trim() || !addressForm.city?.trim() || !addressForm.state?.trim()) {
            setAddressError("Preencha CEP (8 dígitos), rua, número, cidade e UF.");
            return;
        }
        setAddressSaving(true);
        try {
            const payload = {
                label: addressForm.label.trim() || undefined,
                zip_code: zip,
                street: addressForm.street.trim(),
                number: addressForm.number.trim(),
                complement: addressForm.complement.trim() || undefined,
                neighborhood: addressForm.neighborhood.trim() || undefined,
                city: addressForm.city.trim(),
                state: addressForm.state.trim().toUpperCase().slice(0, 2),
            };
            if (editingAddressId) {
                const res = await fetch(`/api/user/addresses/${editingAddressId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    setAddressError(data.error || "Erro ao atualizar.");
                    return;
                }
            } else {
                const res = await fetch("/api/user/addresses", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    setAddressError(data.error || "Erro ao cadastrar.");
                    return;
                }
            }
            setAddressDialogOpen(false);
            fetchAddresses();
        } catch {
            setAddressError("Erro de conexão. Tente novamente.");
        } finally {
            setAddressSaving(false);
        }
    };

    const handleDeleteAddress = async (id: string) => {
        if (!confirm("Excluir este endereço?")) return;
        setDeletingId(id);
        try {
            const res = await fetch(`/api/user/addresses/${id}`, { method: "DELETE" });
            if (res.ok) fetchAddresses();
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-2xl mx-auto space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg">Meu perfil</CardTitle>
                        {!editingProfile && (
                            <Button type="button" variant="outline" size="sm" onClick={() => setEditingProfile(true)}>
                                <Pencil className="w-4 h-4 mr-1" /> Editar
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        {editingProfile ? (
                            <form onSubmit={handleProfileSubmit} className="space-y-4">
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
                                {error && <p className="text-sm text-red-600">{error}</p>}
                                {success && <p className="text-sm text-green-600">Perfil atualizado.</p>}
                                <div className="flex gap-2">
                                    <Button type="submit" disabled={saving}>
                                        {saving ? "Salvando…" : "Salvar"}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => setEditingProfile(false)}>
                                        Cancelar
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-sm text-gray-500">{user.email}</p>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nome</p>
                                    <p className="text-gray-900">{profile?.name || name || "—"}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Telefone / WhatsApp</p>
                                    <p className="text-gray-900">{profile?.phone || phone || "—"}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">CPF / CNPJ</p>
                                    <p className="text-gray-900">
                                    {(() => {
                                        const doc = (document || profile?.document || "").replace(/\D/g, "");
                                        if (doc.length === 11) return doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
                                        if (doc.length === 14) return doc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
                                        return doc || "—";
                                    })()}
                                </p>
                                </div>
                                {success && <p className="text-sm text-green-600">Perfil atualizado.</p>}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {addressesFlash && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                        {addressesFlash}
                        <button
                            type="button"
                            className="ml-2 underline hover:no-underline"
                            onClick={() => setAddressesFlash(null)}
                            aria-label="Fechar"
                        >
                            Fechar
                        </button>
                    </div>
                )}

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="w-5 h-5" /> Endereços de entrega
                        </CardTitle>
                        <Button type="button" variant="outline" size="sm" onClick={openNewAddress}>
                            <Plus className="w-4 h-4 mr-1" /> Novo endereço
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {loadingAddresses ? (
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
                            </p>
                        ) : addresses.length === 0 ? (
                            <p className="text-sm text-gray-500">Nenhum endereço cadastrado. Use &quot;Novo endereço&quot; para adicionar.</p>
                        ) : (
                            <ul className="space-y-3">
                                {addresses.map((addr) => (
                                    <li
                                        key={addr.id}
                                        className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50/50 p-3"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-gray-800">
                                                {addr.label || `${addr.street}, ${addr.number}`}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {addr.street}, {addr.number}
                                                {addr.complement ? ` – ${addr.complement}` : ""}
                                                {addr.neighborhood ? ` – ${addr.neighborhood}` : ""}
                                                {" – "}
                                                {addr.city}/{addr.state} – CEP {addr.zip_code?.replace(/(\d{5})(\d{3})/, "$1-$2")}
                                            </p>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => openEditAddress(addr)}
                                                title="Editar"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleDeleteAddress(addr.id)}
                                                disabled={deletingId === addr.id}
                                                title="Excluir"
                                            >
                                                {deletingId === addr.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                <p>
                    <Link href="/" className="text-sm text-f9-magenta hover:underline">Voltar ao início</Link>
                </p>
            </div>

            <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
                <DialogContent className="sm:max-w-[440px]">
                    <DialogHeader>
                        <DialogTitle>{editingAddressId ? "Editar endereço" : "Novo endereço"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddressSubmit} className="space-y-3">
                        <div>
                            <Label htmlFor="addr-label">Apelido (opcional)</Label>
                            <Input
                                id="addr-label"
                                value={addressForm.label}
                                onChange={(e) => setAddressForm((f) => ({ ...f, label: e.target.value }))}
                                placeholder="Ex.: Casa, Trabalho"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="addr-cep">CEP *</Label>
                            <Input
                                id="addr-cep"
                                value={addressForm.zip_code.replace(/(\d{5})(\d{3})/, "$1-$2")}
                                onChange={(e) => setAddressForm((f) => ({ ...f, zip_code: onlyDigits(e.target.value).slice(0, 8) }))}
                                onBlur={(e) => fetchCep(e.target.value)}
                                placeholder="00000-000"
                                className="mt-1"
                                disabled={cepLoading}
                            />
                            {cepLoading && <span className="text-xs text-gray-500">Buscando…</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="col-span-2">
                                <Label htmlFor="addr-street">Rua *</Label>
                                <Input
                                    id="addr-street"
                                    value={addressForm.street}
                                    onChange={(e) => setAddressForm((f) => ({ ...f, street: e.target.value }))}
                                    placeholder="Rua, avenida"
                                    className="mt-1"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="addr-number">Número *</Label>
                                <Input
                                    id="addr-number"
                                    value={addressForm.number}
                                    onChange={(e) => setAddressForm((f) => ({ ...f, number: e.target.value }))}
                                    placeholder="Nº"
                                    className="mt-1"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="addr-complement">Complemento</Label>
                                <Input
                                    id="addr-complement"
                                    value={addressForm.complement}
                                    onChange={(e) => setAddressForm((f) => ({ ...f, complement: e.target.value }))}
                                    placeholder="Apto, bloco"
                                    className="mt-1"
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="addr-neighborhood">Bairro</Label>
                            <Input
                                id="addr-neighborhood"
                                value={addressForm.neighborhood}
                                onChange={(e) => setAddressForm((f) => ({ ...f, neighborhood: e.target.value }))}
                                placeholder="Bairro"
                                className="mt-1"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label htmlFor="addr-city">Cidade *</Label>
                                <Input
                                    id="addr-city"
                                    value={addressForm.city}
                                    onChange={(e) => setAddressForm((f) => ({ ...f, city: e.target.value }))}
                                    placeholder="Cidade"
                                    className="mt-1"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="addr-state">UF *</Label>
                                <Input
                                    id="addr-state"
                                    value={addressForm.state}
                                    onChange={(e) => setAddressForm((f) => ({ ...f, state: e.target.value.toUpperCase().slice(0, 2) }))}
                                    placeholder="SP"
                                    className="mt-1"
                                    required
                                />
                            </div>
                        </div>
                        {addressError && <p className="text-sm text-red-600">{addressError}</p>}
                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setAddressDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={addressSaving}>
                                {addressSaving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Salvando…
                                    </>
                                ) : editingAddressId ? (
                                    "Salvar"
                                ) : (
                                    "Cadastrar endereço"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </main>
    );
}
