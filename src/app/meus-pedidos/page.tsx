"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Package, Loader2, Truck, ExternalLink } from "lucide-react";

type ShippingOption = {
    transportadora?: string;
    nomeServico?: string;
    prazoMinDias?: number;
    prazoMaxDias?: number;
};

type OrderRow = {
    id: string;
    order_id_mp: string;
    external_reference: string | null;
    status: string;
    total_price: number | null;
    shipping_cost: number | null;
    payment_method: string | null;
    created_at: string;
    package_path: string | null;
    package_generated_at: string | null;
    tracking_code: string | null;
    tracking_url: string | null;
    shipping_option_json: ShippingOption | null;
};

function formatDate(iso: string) {
    try {
        return new Date(iso).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return iso;
    }
}

function formatMoney(value: number) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default function MeusPedidosPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [orders, setOrders] = useState<OrderRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        fetch("/api/user/orders")
            .then((r) => r.json())
            .then((data) => {
                setOrders(Array.isArray(data?.orders) ? data.orders : []);
                setError(data.error ?? null);
            })
            .catch(() => setError("Erro ao carregar pedidos."))
            .finally(() => setLoading(false));
    }, [user]);

    if (authLoading) {
        return (
            <main className="min-h-screen bg-gray-50 py-12 px-4">
                <div className="max-w-2xl mx-auto text-center text-gray-500">Carregando…</div>
            </main>
        );
    }
    if (!user) {
        router.replace("/");
        return null;
    }

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-semibold text-f9-navy mb-6">Meus pedidos</h1>
                {error && (
                    <p className="text-sm text-red-600 mb-4">{error}</p>
                )}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : orders.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center gap-3 text-gray-500">
                                <Package className="h-12 w-12" />
                                <p>Você ainda não tem pedidos.</p>
                                <Link href="/#configurator" className="text-f9-magenta hover:underline">
                                    Fazer um pedido
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <Card key={order.id}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base flex flex-wrap items-center justify-between gap-2">
                                        <span>Pedido #{order.order_id_mp}</span>
                                        <span className="text-xs font-normal text-gray-500">{formatDate(order.created_at)}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <p><span className="text-gray-500">Status:</span> {order.status}</p>
                                    {order.shipping_option_json && (
                                        <p className="flex items-center gap-1.5">
                                            <Truck className="w-4 h-4 text-gray-400 shrink-0" />
                                            <span>
                                                {order.shipping_option_json.transportadora || order.shipping_option_json.nomeServico || "Frete"}
                                                {(order.shipping_option_json.prazoMinDias != null || order.shipping_option_json.prazoMaxDias != null) && (
                                                    <span className="text-gray-500">
                                                        {" "}
                                                        – {order.shipping_option_json.prazoMinDias === order.shipping_option_json.prazoMaxDias
                                                            ? `${order.shipping_option_json.prazoMinDias} dias úteis`
                                                            : `${order.shipping_option_json.prazoMinDias ?? "?"} a ${order.shipping_option_json.prazoMaxDias ?? "?"} dias úteis`}{" "}
                                                        após a postagem
                                                    </span>
                                                )}
                                            </span>
                                        </p>
                                    )}
                                    {order.tracking_url && (
                                        <p>
                                            <a
                                                href={order.tracking_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-f9-magenta hover:underline"
                                            >
                                                Rastrear entrega <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        </p>
                                    )}
                                    {order.tracking_code && !order.tracking_url && (
                                        <div className="rounded bg-gray-100 px-2 py-1.5">
                                            <p className="text-gray-500 text-xs mb-0.5">Código de rastreio:</p>
                                            <p className="font-mono font-semibold text-gray-900 select-all">{order.tracking_code}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Use este código no site dos Correios ou da transportadora para rastrear.
                                            </p>
                                        </div>
                                    )}
                                    {order.total_price != null && (
                                        <p><span className="text-gray-500">Total:</span> {formatMoney(order.total_price)}</p>
                                    )}
                                    {order.package_generated_at && (
                                        <p className="text-green-600">Etiqueta gerada</p>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
                <p className="mt-6">
                    <Link href="/" className="text-sm text-f9-magenta hover:underline">Voltar ao início</Link>
                </p>
            </div>
        </main>
    );
}
