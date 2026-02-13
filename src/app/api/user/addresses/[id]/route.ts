import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/** PATCH /api/user/addresses/[id] – atualiza endereço (apenas do usuário logado) */
export async function PATCH(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getAuthUser();
    if (!user) {
        return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
        return NextResponse.json({ error: "ID do endereço é obrigatório." }, { status: 400 });
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
        body = await _request.json();
    } catch {
        return NextResponse.json({ error: "Body JSON inválido." }, { status: 400 });
    }

    const updates: Record<string, string | null> = {};
    if (typeof body.label === "string") updates.label = body.label.trim() || null;
    if (typeof body.zip_code === "string") updates.zip_code = body.zip_code.replace(/\D/g, "").slice(0, 8) || null;
    if (typeof body.street === "string") updates.street = body.street.trim() || null;
    if (typeof body.number === "string") updates.number = body.number.trim() || null;
    if (typeof body.complement === "string") updates.complement = body.complement.trim() || null;
    if (typeof body.neighborhood === "string") updates.neighborhood = body.neighborhood.trim() || null;
    if (typeof body.city === "string") updates.city = body.city.trim() || null;
    if (typeof body.state === "string") updates.state = body.state.trim().toUpperCase().slice(0, 2) || null;

    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: "Nenhum campo para atualizar." }, { status: 400 });
    }

    const supabase = await createSupabaseServer();
    const { data, error } = await supabase
        .from("user_addresses")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select("id, label, zip_code, street, number, complement, neighborhood, city, state")
        .single();

    if (error) {
        if (error.code === "PGRST116") {
            return NextResponse.json({ error: "Endereço não encontrado." }, { status: 404 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ address: data });
}

/** DELETE /api/user/addresses/[id] – remove endereço (apenas do usuário logado) */
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getAuthUser();
    if (!user) {
        return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
        return NextResponse.json({ error: "ID do endereço é obrigatório." }, { status: 400 });
    }

    const supabase = await createSupabaseServer();
    const { error } = await supabase
        .from("user_addresses")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
}
