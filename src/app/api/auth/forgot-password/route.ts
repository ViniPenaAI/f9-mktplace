import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(request: NextRequest) {
    let body: { email: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Body JSON inválido." }, { status: 400 });
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email) {
        return NextResponse.json({ error: "E-mail é obrigatório." }, { status: 400 });
    }

    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${APP_URL}/redefinir-senha`,
    });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
        ok: true,
        message: "Se este e-mail estiver cadastrado, você receberá um link para redefinir a senha.",
    });
}
