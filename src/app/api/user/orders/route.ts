import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-server";

/** GET /api/user/orders – lista pedidos do usuário logado */
export async function GET() {
    const user = await getAuthUser();
    if (!user) {
        return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }
    if (!supabaseAdmin) {
        return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });
    }

    const { data, error } = await supabaseAdmin
        .from("pedidos")
        .select("id, order_id_mp, external_reference, status, total_price, shipping_cost, payment_method, created_at, package_path, package_generated_at, tracking_code, tracking_url, shipping_option_json")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ orders: data ?? [] });
}
