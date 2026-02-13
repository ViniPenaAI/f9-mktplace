"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cart-store";
import type { CartItem } from "@/lib/cart-types";

/** Hidrata o carrinho com dados da API ao carregar a app (cookie f9_session). */
export function CartSync() {
    const setItems = useCartStore((s) => s.setItems);

    useEffect(() => {
        fetch("/api/cart")
            .then((res) => res.ok ? res.json() : null)
            .then((data: { items?: unknown[] } | null) => {
                if (data?.items && Array.isArray(data.items)) {
                    const items: CartItem[] = data.items.map((r: Record<string, unknown>) => ({
                        id: String(r.id ?? ""),
                        product_type: r.product_type as CartItem["product_type"],
                        product_label: String(r.product_label ?? ""),
                        specs: (r.specs ?? {}) as CartItem["specs"],
                        artwork: (r.artwork ?? {}) as CartItem["artwork"],
                        art_base64: r.art_base64 as string | undefined,
                        unit_price: Number(r.unit_price ?? 0),
                        quantity: Number(r.quantity ?? 1),
                    }));
                    setItems(items);
                }
            })
            .catch(() => {});
    }, [setItems]);

    return null;
}
