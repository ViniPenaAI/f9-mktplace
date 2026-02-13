"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/lib/cart-types";

const CART_STORAGE_KEY = "f9_cart";

interface CartState {
    items: CartItem[];
    addItem: (item: Omit<CartItem, "id">) => void;
    removeItem: (id: string) => void;
    updateItem: (id: string, patch: Partial<Pick<CartItem, "specs" | "product_label" | "unit_price">>) => void;
    clearCart: () => void;
    setItems: (items: CartItem[]) => void;
}

function generateId(): string {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return "cart-" + Date.now() + "-" + Math.random().toString(36).slice(2, 11);
}

export const useCartStore = create<CartState>()(
    persist(
        (set) => ({
            items: [],
            addItem: (item) =>
                set((state) => ({
                    items: [...state.items, { ...item, id: generateId() }],
                })),
            removeItem: (id) =>
                set((state) => ({
                    items: state.items.filter((i) => i.id !== id),
                })),
            updateItem: (id, patch) =>
                set((state) => ({
                    items: state.items.map((i) =>
                        i.id !== id ? i : { ...i, ...patch, specs: patch.specs ?? i.specs }
                    ),
                })),
            clearCart: () => set({ items: [] }),
            setItems: (items) => set({ items }),
        }),
        { name: CART_STORAGE_KEY }
    )
);
