import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";

const COOKIE_NAME = "f9_session";

/** DELETE /api/cart/items/[id] – remove item do carrinho */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const sessionId = request.cookies.get(COOKIE_NAME)?.value;
    if (!sessionId || !supabaseAdmin) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { data: cart } = await supabaseAdmin
        .from("carts")
        .select("id")
        .eq("session_id", sessionId)
        .maybeSingle();

    if (!cart) {
        return NextResponse.json({ error: "Carrinho não encontrado" }, { status: 404 });
    }

    const { error } = await supabaseAdmin
        .from("cart_items")
        .delete()
        .eq("id", id)
        .eq("cart_id", cart.id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return new NextResponse(null, { status: 204 });
}

/** PATCH /api/cart/items/[id] – atualiza quantidade e/ou specs (tamanho) do item */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const sessionId = request.cookies.get(COOKIE_NAME)?.value;
    if (!sessionId || !supabaseAdmin) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { data: cart } = await supabaseAdmin
        .from("carts")
        .select("id")
        .eq("session_id", sessionId)
        .maybeSingle();

    if (!cart) {
        return NextResponse.json({ error: "Carrinho não encontrado" }, { status: 404 });
    }

    let body: { specs?: { width?: number; height?: number; quantity?: number }; product_label?: string; unit_price?: number };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (body.specs != null) {
        const { data: existing } = await supabaseAdmin
            .from("cart_items")
            .select("specs_json")
            .eq("id", id)
            .eq("cart_id", cart.id)
            .single();
        const current = (existing?.specs_json as Record<string, unknown>) ?? {};
        updates.specs_json = { ...current, ...body.specs };
    }
    if (body.product_label != null) updates.product_label = body.product_label;
    if (typeof body.unit_price === "number") updates.unit_price = body.unit_price;

    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
    }

    const { data: row, error } = await supabaseAdmin
        .from("cart_items")
        .update(updates)
        .eq("id", id)
        .eq("cart_id", cart.id)
        .select("id, product_type, product_label, specs_json, artwork_json, art_base64, unit_price, quantity")
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({
        id: row.id,
        product_type: row.product_type,
        product_label: row.product_label,
        specs: row.specs_json ?? {},
        artwork: row.artwork_json ?? {},
        art_base64: row.art_base64 ?? undefined,
        unit_price: Number(row.unit_price),
        quantity: row.quantity ?? 1,
    });
}
