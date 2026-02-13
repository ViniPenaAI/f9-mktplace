import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
    if (!supabaseAdmin) {
        return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
    }

    type AddressInput = {
        label?: string;
        zip_code?: string;
        street?: string;
        number?: string;
        complement?: string;
        neighborhood?: string;
        city?: string;
        state?: string;
    };
    let body: {
        email: string;
        password: string;
        name: string;
        phone?: string;
        document?: string;
        document_type?: "cpf" | "cnpj";
        razao_social?: string;
        addresses?: AddressInput[];
    };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Body JSON inválido." }, { status: 400 });
    }

    const { email, password, name, phone, document, document_type, razao_social, addresses: addressesInput } = body;
    const emailTrim = typeof email === "string" ? email.trim().toLowerCase() : "";
    const passwordTrim = typeof password === "string" ? password : "";
    const nameTrim = typeof name === "string" ? name.trim() : "";

    if (!emailTrim || !passwordTrim) {
        return NextResponse.json({ error: "E-mail e senha são obrigatórios." }, { status: 400 });
    }
    if (passwordTrim.length < 6) {
        return NextResponse.json({ error: "A senha deve ter no mínimo 6 caracteres." }, { status: 400 });
    }
    if (!nameTrim) {
        return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: emailTrim,
        password: passwordTrim,
        email_confirm: true,
    });

    if (authError) {
        if (authError.message.includes("already been registered") || authError.message.includes("already exists")) {
            return NextResponse.json({ error: "Este e-mail já está cadastrado." }, { status: 409 });
        }
        return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user?.id;
    if (!userId) {
        return NextResponse.json({ error: "Falha ao criar usuário." }, { status: 500 });
    }

    const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert({
            id: userId,
            email: emailTrim,
            name: nameTrim,
            phone: phone?.trim() || null,
            document: document?.trim() || null,
            document_type: document_type || null,
            razao_social: razao_social?.trim() || null,
        });

    if (profileError) {
        return NextResponse.json({ error: "Falha ao criar perfil: " + profileError.message }, { status: 500 });
    }

    if (Array.isArray(addressesInput) && addressesInput.length > 0) {
        for (const a of addressesInput) {
            const zip = typeof a.zip_code === "string" ? a.zip_code.replace(/\D/g, "").slice(0, 8) : "";
            const street = typeof a.street === "string" ? a.street.trim() : "";
            const number = typeof a.number === "string" ? a.number.trim() : "";
            const city = typeof a.city === "string" ? a.city.trim() : "";
            const state = typeof a.state === "string" ? a.state.trim().toUpperCase().slice(0, 2) : "";
            if (zip.length === 8 && street && number && city && state.length === 2) {
                const { error: addrError } = await supabaseAdmin.from("user_addresses").insert({
                    user_id: userId,
                    label: typeof a.label === "string" ? a.label.trim() || null : null,
                    zip_code: zip,
                    street,
                    number,
                    complement: typeof a.complement === "string" ? a.complement.trim() || null : null,
                    neighborhood: typeof a.neighborhood === "string" ? a.neighborhood.trim() || null : null,
                    city,
                    state,
                });
                if (addrError) {
                    console.warn("[register] Endereço não salvo na API (será tentado após login):", addrError.message);
                }
            }
        }
    }

    return NextResponse.json({ ok: true, user_id: userId });
}
