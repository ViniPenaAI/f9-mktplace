import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/** GET /api/user/addresses – lista endereços do usuário logado */
export async function GET() {
    const user = await getAuthUser();
    if (!user) {
        return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const supabase = await createSupabaseServer();
    const { data, error } = await supabase
        .from("user_addresses")
        .select("id, label, zip_code, street, number, complement, neighborhood, city, state")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ addresses: data ?? [] });
}

/** POST /api/user/addresses – cria endereço do usuário logado */
export async function POST(request: NextRequest) {
    const user = await getAuthUser();
    if (!user) {
        return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    let body: {
        label?: string;
        zip_code?: string;
        street?: string;
        number?: string;
        complement?: string;
        neighborhood?: string;
        city?: string;
        state?: string;
    };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Body JSON inválido." }, { status: 400 });
    }

    const zip_code = typeof body.zip_code === "string" ? body.zip_code.replace(/\D/g, "").slice(0, 8) : "";
    const street = typeof body.street === "string" ? body.street.trim() : "";
    const number = typeof body.number === "string" ? body.number.trim() : "";
    const city = typeof body.city === "string" ? body.city.trim() : "";
    const state = typeof body.state === "string" ? body.state.trim().toUpperCase().slice(0, 2) : "";
    if (!zip_code || zip_code.length !== 8 || !street || !number || !city || !state) {
        return NextResponse.json(
            { error: "CEP (8 dígitos), rua, número, cidade e UF são obrigatórios." },
            { status: 400 }
        );
    }

    const supabase = await createSupabaseServer();
    const { data, error } = await supabase
        .from("user_addresses")
        .insert({
            user_id: user.id,
            label: typeof body.label === "string" ? body.label.trim() || null : null,
            zip_code,
            street,
            number,
            complement: typeof body.complement === "string" ? body.complement.trim() || null : null,
            neighborhood: typeof body.neighborhood === "string" ? body.neighborhood.trim() || null : null,
            city,
            state,
        })
        .select("id, label, zip_code, street, number, complement, neighborhood, city, state")
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ address: data });
}
