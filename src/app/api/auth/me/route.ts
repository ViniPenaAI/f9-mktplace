import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
    const user = await getAuthUser();
    if (!user) {
        return NextResponse.json({ user: null, profile: null });
    }

    if (!supabaseAdmin) {
        return NextResponse.json({
            user: { id: user.id, email: user.email ?? "" },
            profile: null,
        });
    }

    const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id, email, name, phone, document, document_type, razao_social")
        .eq("id", user.id)
        .single();

    return NextResponse.json({
        user: { id: user.id, email: user.email ?? "" },
        profile: profile ?? null,
    });
}
