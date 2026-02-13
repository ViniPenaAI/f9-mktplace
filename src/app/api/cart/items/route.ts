import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

const COOKIE_NAME = "f9_session";

async function getCartId(request: NextRequest): Promise<{ cartId: string } | null> {
    const sessionId = request.cookies.get(COOKIE_NAME)?.value;
    if (!sessionId || !supabaseAdmin) return null;
    const { data } = await supabaseAdmin
        .from("carts")
        .select("id")
        .eq("session_id", sessionId)
        .maybeSingle();
    if (!data?.id) return null;
    return { cartId: data.id };
}

/** POST /api/cart/items – adiciona item ao carrinho */
export async function POST(request: NextRequest) {
    const cart = await getCartId(request);
    if (!cart) {
        return NextResponse.json(
            { error: "Carrinho não encontrado. Chame GET /api/cart antes." },
            { status: 400 }
        );
    }

    let body: {
        product_type: string;
        product_label: string;
        specs: Record<string, unknown>;
        artwork: Record<string, unknown>;
        art_base64?: string;
        unit_price: number;
        quantity?: number;
    };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
    }

    const { product_type, product_label, specs, artwork, art_base64, unit_price, quantity = 1 } = body;
    if (!product_type || product_label == null || unit_price == null) {
        return NextResponse.json({ error: "product_type, product_label e unit_price são obrigatórios" }, { status: 400 });
    }

    const { data: maxOrder } = await supabaseAdmin!
        .from("cart_items")
        .select("sort_order")
        .eq("cart_id", cart.cartId)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();

    const sortOrder = (maxOrder?.sort_order ?? -1) + 1;

    const { data: row, error } = await supabaseAdmin!
        .from("cart_items")
        .insert({
            cart_id: cart.cartId,
            product_type,
            product_label,
            specs_json: specs ?? {},
            artwork_json: artwork ?? {},
            art_base64: art_base64 ?? null,
            unit_price: Number(unit_price),
            quantity: Math.max(1, Number(quantity) | 0),
            sort_order: sortOrder,
        })
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
    }, { status: 201 });
}
