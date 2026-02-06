import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { compileOrder } from "@/lib/compile-order";
import type { OrderConfirmBody } from "@/lib/order-types";

export async function POST(request: NextRequest) {
    if (!supabaseAdmin) {
        return NextResponse.json(
            { error: "Supabase não configurado. Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY." },
            { status: 503 }
        );
    }

    let body: OrderConfirmBody;
    try {
        body = (await request.json()) as OrderConfirmBody;
    } catch {
        return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
    }

    const {
        order_id,
        status,
        payment_method,
        installments,
        payment_response,
        customer,
        shipping,
        specs,
        artwork,
        selectedProduct,
        totalPrice,
        shippingCost,
    } = body;

    if (!order_id?.trim()) {
        return NextResponse.json({ error: "order_id é obrigatório" }, { status: 400 });
    }

    const customerJson = {
        name: customer?.name ?? "",
        email: customer?.email ?? "",
        phone: customer?.phone ?? "",
        document: customer?.document ?? "",
    };
    const shippingJson = {
        zipCode: shipping?.zipCode ?? "",
        street: shipping?.street ?? "",
        number: shipping?.number ?? "",
        complement: shipping?.complement,
        neighborhood: shipping?.neighborhood,
        city: shipping?.city ?? "",
        state: shipping?.state ?? "",
    };
    const specsJson = {
        format: specs?.format,
        width: specs?.width,
        height: specs?.height,
        material: specs?.material,
        finish: specs?.finish,
        quantity: specs?.quantity,
    };
    const artworkJson = {
        presentationType: artwork?.presentationType,
        selectedDesignUrl: artwork?.selectedDesignUrl,
        enhancedDesignUrl: artwork?.enhancedDesignUrl,
        approvalScale: artwork?.approvalScale,
        cutAreaScale: artwork?.cutAreaScale,
    };

    const row = {
        order_id_mp: order_id,
        external_reference: null as string | null,
        status: status || "pending",
        customer_json: customerJson,
        shipping_json: shippingJson,
        specs_json: specsJson,
        artwork_json: artworkJson,
        product_type: selectedProduct ?? null,
        presentation_type: artwork?.presentationType ?? null,
        total_price: typeof totalPrice === "number" ? totalPrice : null,
        shipping_cost: typeof shippingCost === "number" ? shippingCost : null,
        payment_method: payment_method ?? null,
        installments: typeof installments === "number" ? installments : null,
        payment_response_json: payment_response ?? null,
    };

    const { data: existing } = await supabaseAdmin
        .from("pedidos")
        .select("id, package_generated_at")
        .eq("order_id_mp", order_id)
        .maybeSingle();

    let pedidoId: string;
    if (existing) {
        const { error: updateErr } = await supabaseAdmin
            .from("pedidos")
            .update({
                ...row,
                updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        if (updateErr) {
            return NextResponse.json({ error: updateErr.message }, { status: 500 });
        }
        pedidoId = existing.id;
    } else {
        const { data: inserted, error: insertErr } = await supabaseAdmin
            .from("pedidos")
            .insert(row)
            .select("id")
            .single();
        if (insertErr) {
            return NextResponse.json({ error: insertErr.message }, { status: 500 });
        }
        pedidoId = inserted.id;
    }

    const shouldCompile =
        (status === "approved" || status === "processed") && !existing?.package_generated_at;
    const artBase64 = artwork?.artBase64;

    if (shouldCompile) {
        const compileResult = await compileOrder(pedidoId, artBase64);
        if (!compileResult.ok) {
            return NextResponse.json(
                { ok: true, pedido_id: pedidoId, compile_warning: compileResult.error },
                { status: 200 }
            );
        }
    }

    return NextResponse.json({ ok: true, pedido_id: pedidoId });
}
