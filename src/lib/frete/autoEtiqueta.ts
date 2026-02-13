import { supabaseAdmin } from "@/lib/supabase-server";
import { gerarEtiquetaMelhorEnvio, obterUrlImpressaoMelhorEnvio } from "@/lib/frete/melhorEnvioClient";
import type { EtiquetaEndereco } from "@/lib/frete/melhorEnvioClient";
import { calcRotulosPackage } from "@/lib/shipping-rotulos";
import type { PedidoRow } from "@/lib/order-types";

function buildFromEnv(): EtiquetaEndereco | null {
    const nome = process.env.MELHOR_ENVIO_FROM_NAME;
    const cep = process.env.MELHOR_ENVIO_FROM_ZIPCODE;
    const rua = process.env.MELHOR_ENVIO_FROM_STREET;
    const numero = process.env.MELHOR_ENVIO_FROM_NUMBER;
    const cidade = process.env.MELHOR_ENVIO_FROM_CITY;
    const estado = process.env.MELHOR_ENVIO_FROM_STATE;

    if (!nome || !cep || !rua || !numero || !cidade || !estado) {
        console.warn(
            "[autoEtiqueta] Dados de remetente incompletos. Configure MELHOR_ENVIO_FROM_* no .env para gerar etiqueta automática."
        );
        return null;
    }

    return {
        nome,
        documento: process.env.MELHOR_ENVIO_FROM_DOCUMENT || "",
        telefone: process.env.MELHOR_ENVIO_FROM_PHONE || "",
        email: process.env.MELHOR_ENVIO_FROM_EMAIL || "",
        cep,
        rua,
        numero,
        complemento: process.env.MELHOR_ENVIO_FROM_COMPLEMENT || undefined,
        bairro: process.env.MELHOR_ENVIO_FROM_DISTRICT || "",
        cidade,
        estado,
    };
}

function buildToFromPedido(row: PedidoRow): EtiquetaEndereco | null {
    const c = (row.customer_json || {}) as Record<string, string>;
    const s = (row.shipping_json || {}) as Record<string, string>;
    const zip = (s.zipCode || "").toString().trim();
    if (!zip) {
        console.warn("[autoEtiqueta] CEP do destinatário ausente; etiqueta não será gerada.", {
            order_id_mp: row.order_id_mp,
        });
        return null;
    }

    return {
        nome: (c.name as string) || "",
        documento: (c.document as string) || "",
        telefone: (c.phone as string) || "",
        email: (c.email as string) || "",
        cep: zip,
        rua: (s.street as string) || "",
        numero: (s.number as string) || "",
        complemento: (s.complement as string) || undefined,
        bairro: (s.neighborhood as string) || "",
        cidade: (s.city as string) || "",
        estado: (s.state as string) || "",
    };
}

/** Gera (se ainda não existir) uma etiqueta Melhor Envio para o pedido. Não paga nem baixa o PDF. */
export async function ensureEtiquetaParaPedido(pedidoId: string): Promise<void> {
    if (!supabaseAdmin) return;

    const { data: pedido, error } = await supabaseAdmin
        .from("pedidos")
        .select("*")
        .eq("id", pedidoId)
        .maybeSingle();

    if (error || !pedido) {
        console.error("[autoEtiqueta] Pedido não encontrado para gerar etiqueta:", pedidoId, error?.message);
        return;
    }

    const row = pedido as unknown as PedidoRow;

    // Já existe etiqueta para este pedido? Não faz nada.
    const { data: existing } = await supabaseAdmin
        .from("etiquetas_frete")
        .select("id")
        .eq("pedido_id", row.id)
        .maybeSingle();
    if (existing) {
        return;
    }

    const shippingOpt = (row.shipping_option_json || null) as
        | {
              provider?: string;
              providerServicoId?: string;
          }
        | null;
    if (!shippingOpt || shippingOpt.provider !== "melhor-envio" || !shippingOpt.providerServicoId) {
        // Pedido sem frete via Melhor Envio – nada a fazer.
        return;
    }

    const from = buildFromEnv();
    const to = buildToFromPedido(row);
    if (!from || !to) return;

    const spec = (row.specs_json || {}) as Record<string, unknown>;
    const qty = (spec.quantity as number) ?? 0;
    const largura = (spec.width as number) ?? 0;
    const altura = (spec.height as number) ?? 0;

    let pesoKg = 0.3;
    let comprimentoCm = 16;
    let larguraCm = 16;
    let alturaCm = 16;

    try {
        if (qty > 0 && largura > 0 && altura > 0) {
            const pkg = calcRotulosPackage({
                quantity: qty,
                format: (row.presentation_type as "cartela" | "unidades") || "cartela",
                widthMm: largura,
                heightMm: altura,
            });
            pesoKg = pkg.pesoKg;
            comprimentoCm = pkg.comprimentoCm;
            larguraCm = pkg.larguraCm;
            alturaCm = pkg.alturaCm;
        }
    } catch (e) {
        console.warn("[autoEtiqueta] Falha ao calcular embalagem, usando defaults.", e);
    }

    try {
        const etiqueta = await gerarEtiquetaMelhorEnvio({
            serviceId: String(shippingOpt.providerServicoId),
            from,
            to,
            package: {
                pesoKg,
                larguraCm,
                alturaCm,
                comprimentoCm,
                valorDeclarado: Number(row.total_price || 0),
            },
        });

        const providerId = String(etiqueta.id ?? "");
        const codigoRastreio = etiqueta.tracking ?? null;
        const urlImpressao = obterUrlImpressaoMelhorEnvio([providerId]);

        await supabaseAdmin.from("etiquetas_frete").upsert(
            {
                pedido_id: row.id,
                provider: "melhor-envio",
                provider_etiqueta_id: providerId,
                url_impressao: urlImpressao ?? undefined,
                codigo_rastreio: codigoRastreio ?? undefined,
                status: (etiqueta.status as string) ?? "pending_payment",
                updated_at: new Date().toISOString(),
            },
            { onConflict: "pedido_id" }
        );
        if (codigoRastreio) {
            await supabaseAdmin
                .from("pedidos")
                .update({
                    tracking_code: codigoRastreio,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", row.id);
        }
    } catch (e) {
        console.error("[autoEtiqueta] Erro ao gerar etiqueta Melhor Envio:", e);
    }
}

