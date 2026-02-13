import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

/** GET /api/auth/check-email?email=xxx – retorna { exists: boolean } para uso no checkout. */
export async function GET(request: NextRequest) {
    const email = request.nextUrl.searchParams.get("email");
    const emailTrim = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!emailTrim) {
        return NextResponse.json({ exists: false });
    }

    if (!supabaseAdmin) {
        return NextResponse.json({ exists: false });
    }

    const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", emailTrim)
        .maybeSingle();

    if (error) {
        return NextResponse.json({ exists: false });
    }

    return NextResponse.json({ exists: !!data });
}
