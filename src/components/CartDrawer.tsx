"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart-store";
import { useCartDrawerStore } from "@/store/cart-drawer-store";
import { ShoppingBag, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    buildCartItemLabel,
    getMinQuantityForSize,
    calculatePriceForSpecs,
    type CartItem,
} from "@/lib/cart-types";
import type { ProductSpecs } from "@/store/configurator-store";

function formatPrice(value: number): string {
    return value.toFixed(2).replace(".", ",");
}

export function CartDrawer() {
    const router = useRouter();
    const { open, closeDrawer } = useCartDrawerStore();
    const { items, removeItem, updateItem } = useCartStore();
    const total = items.reduce((s, i) => s + i.unit_price, 0);

    const [editingItem, setEditingItem] = useState<CartItem | null>(null);
    const [editQuantity, setEditQuantity] = useState(0);
    const [editWidth, setEditWidth] = useState(0);
    const [editHeight, setEditHeight] = useState(0);
    const [editSaving, setEditSaving] = useState(false);

    const handleIrParaPagamento = () => {
        closeDrawer();
        router.push("/?checkout=1#configurator");
        setTimeout(() => {
            document.getElementById("configurator")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
    };

    const openEdit = (item: CartItem) => {
        const qty = typeof item.specs?.quantity === "number" ? item.specs.quantity : item.quantity || 1;
        setEditingItem(item);
        setEditQuantity(qty);
        setEditWidth((item.specs?.width ?? 50) / 10);
        setEditHeight((item.specs?.height ?? 50) / 10);
    };

    const minQty = editingItem
        ? getMinQuantityForSize(editWidth * 10, editHeight * 10)
        : 1;

    const handleSaveEdit = async () => {
        if (!editingItem) return;
        const qty = Math.max(minQty, Math.round(editQuantity));
        const w = Math.max(10, Math.round(editWidth * 10));
        const h = Math.max(10, Math.round(editHeight * 10));
        const newSpecs: ProductSpecs = {
            ...editingItem.specs,
            width: w,
            height: h,
            quantity: qty,
        };
        const product_label = buildCartItemLabel(editingItem.product_type, newSpecs);
        const unit_price = calculatePriceForSpecs(newSpecs);

        setEditSaving(true);
        try {
            const res = await fetch(`/api/cart/items/${editingItem.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    specs: { width: w, height: h, quantity: qty },
                    product_label,
                    unit_price,
                }),
            });
            if (res.ok) {
                updateItem(editingItem.id, { specs: newSpecs, product_label, unit_price });
                setEditingItem(null);
            }
        } catch {
            // fallback local
            updateItem(editingItem.id, { specs: newSpecs, product_label, unit_price });
            setEditingItem(null);
        }
        setEditSaving(false);
    };

    return (
        <>
            <Sheet open={open} onOpenChange={(v) => !v && closeDrawer()}>
                <SheetContent
                    side="right"
                    className="w-full max-w-[320px] sm:max-w-[340px] flex flex-col p-0 border-l border-slate-200/80 bg-slate-50/95"
                    aria-describedby={undefined}
                >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/80">
                        <SheetTitle className="flex items-center gap-2 text-sm font-semibold text-slate-800 m-0">
                            <ShoppingBag className="h-5 w-5 text-f9-blue" strokeWidth={1.8} aria-hidden />
                            Carrinho
                            {items.length > 0 && (
                                <span className="text-xs text-slate-500 font-normal">({items.length})</span>
                            )}
                        </SheetTitle>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
                        {items.length === 0 ? (
                            <p className="text-slate-500 text-sm py-8 text-center">Nenhum item. Feche e continue configurando.</p>
                        ) : (
                            <ul className="space-y-2">
                                {items.map((item) => {
                                    const qty = typeof item.specs?.quantity === "number" ? item.specs.quantity : item.quantity || 1;
                                    const lineTotal = item.unit_price;
                                    return (
                                        <li
                                            key={item.id}
                                            className="flex gap-2 py-2.5 px-2 -mx-2 rounded-lg hover:bg-slate-100/80 transition-colors text-sm"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <span className="text-slate-700 font-medium leading-tight">
                                                    {qty} un. · {item.product_label}
                                                </span>
                                                <span className="text-f9-blue font-semibold text-xs block mt-1">
                                                    R$ {formatPrice(lineTotal)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-0.5 shrink-0">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-500 hover:text-f9-blue hover:bg-slate-100"
                                                    onClick={() => openEdit(item)}
                                                    aria-label="Editar"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                    onClick={async () => {
                                                        try {
                                                            await fetch(`/api/cart/items/${item.id}`, { method: "DELETE" });
                                                        } catch {
                                                            //
                                                        }
                                                        removeItem(item.id);
                                                    }}
                                                    aria-label="Remover"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                    {items.length > 0 && (
                        <div className="p-4 border-t border-slate-200/80 bg-white/80 space-y-2.5">
                            <div className="flex justify-between text-sm font-semibold text-slate-800">
                                <span>Total</span>
                                <span className="text-f9-blue">R$ {formatPrice(total)}</span>
                            </div>
                            <p className="text-[11px] text-slate-500">Frete no checkout.</p>
                            <Button className="w-full h-10 text-sm" onClick={handleIrParaPagamento}>
                                Ir para o pagamento
                            </Button>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            <Dialog open={!!editingItem} onOpenChange={(v) => !v && setEditingItem(null)}>
                <DialogContent className="sm:max-w-[360px]">
                    <DialogHeader>
                        <DialogTitle>Editar item</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>Largura (cm)</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={200}
                                    step={0.1}
                                    value={editWidth || ""}
                                    onChange={(e) => setEditWidth(Number(e.target.value) || 0)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Altura (cm)</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={200}
                                    step={0.1}
                                    value={editHeight || ""}
                                    onChange={(e) => setEditHeight(Number(e.target.value) || 0)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Quantidade (mín. {minQty} un.)</Label>
                            <Input
                                type="number"
                                min={minQty}
                                value={editQuantity || ""}
                                onChange={(e) => setEditQuantity(Math.max(minQty, Number(e.target.value) || minQty))}
                            />
                            <p className="text-xs text-slate-500">
                                Mínimo para 1 m²: {minQty} un.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingItem(null)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveEdit} disabled={editSaving}>
                            {editSaving ? "Salvando…" : "Salvar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
