import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

const COOKIE_NAME = "f9_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function getOrCreateSessionId(request: NextRequest): string {
    const existing = request.cookies.get(COOKIE_NAME)?.value;
    if (existing) return existing;
    return crypto.randomUUID();
}

/** GET /api/cart – retorna itens do carrinho (cria carrinho/sessão se não existir) */
export async function GET(request: NextRequest) {
    if (!supabaseAdmin) {
        return NextResponse.json({ items: [] });
    }
    const sessionId = getOrCreateSessionId(request);

    const { data: cart } = await supabaseAdmin
        .from("carts")
        .select("id")
        .eq("session_id", sessionId)
        .maybeSingle();

    let cartId = cart?.id;
    if (!cartId) {
        const { data: newCart, error: createErr } = await supabaseAdmin
            .from("carts")
            .insert({ session_id: sessionId })
            .select("id")
            .single();
        if (createErr || !newCart) {
            return NextResponse.json({ items: [] });
        }
        cartId = newCart.id;
    }

    const { data: rows } = await supabaseAdmin
        .from("cart_items")
        .select("id, product_type, product_label, specs_json, artwork_json, art_base64, unit_price, quantity")
        .eq("cart_id", cartId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

    const items = (rows ?? []).map((r) => ({
        id: r.id,
        product_type: r.product_type,
        product_label: r.product_label,
        specs: (r.specs_json ?? {}) as Record<string, unknown>,
        artwork: (r.artwork_json ?? {}) as Record<string, unknown>,
        art_base64: r.art_base64 ?? undefined,
        unit_price: Number(r.unit_price),
        quantity: r.quantity ?? 1,
    }));

    const res = NextResponse.json({ items, cart_id: cartId });
    if (!request.cookies.get(COOKIE_NAME)) {
        res.cookies.set(COOKIE_NAME, sessionId, {
            path: "/",
            maxAge: COOKIE_MAX_AGE,
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
        });
    }
    return res;
}

/** POST /api/cart – cria carrinho (opcional; GET já cria se precisar) */
export async function POST(request: NextRequest) {
    if (!supabaseAdmin) {
        return NextResponse.json({ error: "Supabase não configurado" }, { status: 503 });
    }
    const sessionId = getOrCreateSessionId(request);

    const { data: existing } = await supabaseAdmin
        .from("carts")
        .select("id")
        .eq("session_id", sessionId)
        .maybeSingle();

    if (existing) {
        return NextResponse.json({ cart_id: existing.id, session_id: sessionId });
    }

    const { data: newCart, error } = await supabaseAdmin
        .from("carts")
        .insert({ session_id: sessionId })
        .select("id")
        .single();

    if (error || !newCart) {
        return NextResponse.json({ error: "Erro ao criar carrinho" }, { status: 500 });
    }

    const res = NextResponse.json({ cart_id: newCart.id, session_id: sessionId });
    res.cookies.set(COOKIE_NAME, sessionId, {
        path: "/",
        maxAge: COOKIE_MAX_AGE,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
    });
    return res;
}
