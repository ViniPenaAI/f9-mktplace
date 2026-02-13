import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/** PATCH /api/user/profile – atualiza nome, phone, document do perfil (RLS) */
export async function PATCH(request: NextRequest) {
    const user = await getAuthUser();
    if (!user) {
        return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    let body: { name?: string; phone?: string; document?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Body JSON inválido." }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (typeof body.name === "string") updates.name = body.name.trim() || "";
    if (typeof body.phone === "string") updates.phone = body.phone.trim() || null;
    if (typeof body.document === "string") updates.document = body.document.replace(/\D/g, "").slice(0, 14) || null;

    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: "Nenhum campo para atualizar." }, { status: 400 });
    }

    const supabase = await createSupabaseServer();
    const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select("id, email, name, phone, document, document_type, razao_social")
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ profile: data });
}
