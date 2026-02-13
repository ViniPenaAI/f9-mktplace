import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getAuthUser } from "@/lib/supabase/server";
import type { OrderConfirmBody } from "@/lib/order-types";
import { ensureEtiquetaParaPedido } from "@/lib/frete/autoEtiqueta";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
    if (!supabaseAdmin) {
        return NextResponse.json(
            { error: "Supabase não configurado. Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY." },
            { status: 503 }
        );
    }

    const authUser = await getAuthUser();
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
        user_id: bodyUserId,
        customer,
        shipping,
        specs,
        artwork,
        selectedProduct,
        totalPrice,
        shippingCost,
        shippingOption,
        items: cartItems,
    } = body;

    const userId = bodyUserId ?? authUser?.id ?? null;

    if (!order_id?.trim()) {
        return NextResponse.json({ error: "order_id é obrigatório" }, { status: 400 });
    }

    const customerJson = {
        name: customer?.name ?? "",
        email: customer?.email ?? "",
        phone: customer?.phone ?? "",
        document: customer?.document ?? "",
        documentType: (customer as { documentType?: string })?.documentType ?? null,
        razao_social: (customer as { razao_social?: string })?.razao_social ?? null,
        phone_business: (customer as { phone_business?: string })?.phone_business ?? null,
        email_business: (customer as { email_business?: string })?.email_business ?? null,
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
    const shippingOptionJson =
        shippingOption && typeof shippingOption === "object"
            ? {
                  provider: shippingOption.provider,
                  providerServicoId: shippingOption.providerServicoId,
                  transportadora: shippingOption.transportadora,
                  nomeServico: shippingOption.nomeServico,
                  preco: shippingOption.preco,
                  prazoMinDias: shippingOption.prazoMinDias,
                  prazoMaxDias: shippingOption.prazoMaxDias,
              }
            : null;

    const isCartCheckout = Array.isArray(cartItems) && cartItems.length > 0;

    if (isCartCheckout) {
        const pedidoIds: string[] = [];
        const totalShipping = typeof shippingCost === "number" ? shippingCost : 0;
        for (let i = 0; i < cartItems!.length; i++) {
            const item = cartItems![i];
            const specsJson = item.specs
                ? {
                      format: item.specs.format,
                      width: item.specs.width,
                      height: item.specs.height,
                      material: item.specs.material,
                      finish: item.specs.finish,
                      quantity: item.specs.quantity,
                  }
                : {};
            const artworkJson = item.artwork
                ? {
                      presentationType: item.artwork.presentationType,
                      selectedDesignUrl: item.artwork.selectedDesignUrl,
                      enhancedDesignUrl: item.artwork.enhancedDesignUrl,
                      approvalScale: item.artwork.approvalScale,
                      cutAreaScale: item.artwork.cutAreaScale,
                  }
                : {};
            const orderIdMp = `${order_id}_i${i}`;
            const row = {
                order_id_mp: orderIdMp,
                external_reference: order_id,
                status: status || "pending",
                user_id: userId,
                customer_json: customerJson,
                shipping_json: shippingJson,
                specs_json: specsJson,
                artwork_json: artworkJson,
                product_type: item.selectedProduct ?? null,
                shipping_option_json: shippingOptionJson,
                presentation_type: item.artwork?.presentationType ?? null,
                total_price: typeof item.totalPrice === "number" ? item.totalPrice : null,
                shipping_cost: i === 0 ? totalShipping : 0,
                payment_method: payment_method ?? null,
                installments: typeof installments === "number" ? installments : null,
                payment_response_json: payment_response ?? null,
            };
            const { data: inserted, error: insertErr } = await supabaseAdmin
                .from("pedidos")
                .insert(row)
                .select("id")
                .single();
            if (insertErr) {
                return NextResponse.json({ error: insertErr.message }, { status: 500 });
            }
            pedidoIds.push(inserted.id);
            if (item.artwork?.artBase64) {
                try {
                    const { compileOrder } = await import("@/lib/compile-order");
                    await compileOrder(inserted.id, item.artwork.artBase64);
                } catch (err) {
                    console.error("[orders/confirm] Compilação item:", err);
                }
            }
        }
        for (const pid of pedidoIds) {
            try {
                await ensureEtiquetaParaPedido(pid);
            } catch (err) {
                console.error("[orders/confirm] Erro etiqueta pedido", pid, err);
            }
        }
        return NextResponse.json({ ok: true, pedido_id: pedidoIds[0], pedido_ids: pedidoIds });
    }

    // Pedido único (configurador direto)
    const specsJson = specs
        ? {
              format: specs.format,
              width: specs.width,
              height: specs.height,
              material: specs.material,
              finish: specs.finish,
              quantity: specs.quantity,
          }
        : {};
    const artworkJson = artwork
        ? {
              presentationType: artwork.presentationType,
              selectedDesignUrl: artwork.selectedDesignUrl,
              enhancedDesignUrl: artwork.enhancedDesignUrl,
              approvalScale: artwork.approvalScale,
              cutAreaScale: artwork.cutAreaScale,
          }
        : {};
    const row = {
        order_id_mp: order_id,
        external_reference: null as string | null,
        status: status || "pending",
        user_id: userId,
        customer_json: customerJson,
        shipping_json: shippingJson,
        specs_json: specsJson,
        artwork_json: artworkJson,
        product_type: selectedProduct ?? null,
        shipping_option_json: shippingOptionJson,
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
        (status === "approved" || status === "processed" || status === "pending") && !existing?.package_generated_at;
    const artBase64 = artwork?.artBase64;

    if (shouldCompile) {
        try {
            const { compileOrder } = await import("@/lib/compile-order");
            const compileResult = await compileOrder(pedidoId, artBase64, { totalItems: 1, itemIndex: 0 });
            if (!compileResult.ok) {
                console.error("[orders/confirm] Compilação falhou:", compileResult.error);
                return NextResponse.json(
                    { ok: true, pedido_id: pedidoId, compile_warning: compileResult.error },
                    { status: 200 }
                );
            }
        } catch (err) {
            console.error("[orders/confirm] Erro ao compilar:", err);
            return NextResponse.json(
                { ok: true, pedido_id: pedidoId, compile_warning: err instanceof Error ? err.message : "Erro ao compilar" },
                { status: 200 }
            );
        }
    }

    // Após salvar o pedido (e compilar, se necessário), garante a criação da etiqueta no Melhor Envio,
    // sem pagamento automático – fica "pending_payment" para você pagar e baixar no painel.
    try {
        await ensureEtiquetaParaPedido(pedidoId);
    } catch (err) {
        console.error("[orders/confirm] Erro ao gerar etiqueta automática:", err);
    }

    return NextResponse.json({ ok: true, pedido_id: pedidoId });
}
