"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cart-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function formatPrice(value: number): string {
    return value.toFixed(2).replace(".", ",");
}

export default function CarrinhoPage() {
    const { items, removeItem } = useCartStore();
    const total = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);

    return (
        <div className="container mx-auto px-4 py-12 max-w-2xl">
            <h1 className="text-2xl font-bold text-f9-navy mb-6">Meu carrinho</h1>

            {items.length === 0 ? (
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-gray-600 text-center py-8">Seu carrinho está vazio.</p>
                        <Link href="/#configurator">
                            <Button className="w-full">Configurar produto</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <Card className="mb-6">
                        <CardContent className="pt-6">
                            <ul className="space-y-4">
                                {items.map((item) => (
                                    <li
                                        key={item.id}
                                        className="flex justify-between gap-4 py-2 border-b border-gray-100 last:border-0"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <span className="font-medium">
                                                {typeof item.specs?.quantity === "number" ? item.specs.quantity : item.quantity}{" "}un. – {item.product_label}
                                            </span>
                                            <span className="text-f9-blue font-semibold ml-2">
                                                R$ {formatPrice(item.unit_price * item.quantity)}
                                            </span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600 shrink-0"
                                            onClick={async () => {
                                                try {
                                                    await fetch(`/api/cart/items/${item.id}`, { method: "DELETE" });
                                                } catch {
                                                    // ignora erro (item pode ser só local)
                                                }
                                                removeItem(item.id);
                                            }}
                                        >
                                            Remover
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    <div className="flex justify-between items-center text-lg font-bold mb-2">
                        <span>Total</span>
                        <span>R$ {formatPrice(total)}</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-6">O frete será calculado no checkout.</p>

                    <Link href="/?checkout=1#configurator">
                        <Button className="w-full" size="lg">
                            Ir para o pagamento
                        </Button>
                    </Link>
                </>
            )}
        </div>
    );
}
