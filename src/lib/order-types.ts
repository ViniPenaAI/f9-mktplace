import type { CustomerData, ShippingData, ProductSpecs, ArtworkData } from "@/store/configurator-store";
import type { ProductType } from "@/store/configurator-store";
import type { PresentationType } from "@/store/configurator-store";

/** Um item ao confirmar pedido vindo do carrinho. */
export interface OrderConfirmItem {
    specs: ProductSpecs;
    artwork: Pick<ArtworkData, "presentationType" | "selectedDesignUrl" | "enhancedDesignUrl" | "approvalScale" | "cutAreaScale"> & { artBase64?: string };
    selectedProduct: ProductType | null;
    totalPrice: number;
}

/** Payload enviado pelo front ao confirmar pedido (após sucesso do pagamento). */
export interface OrderConfirmBody {
    order_id: string;
    status: string;
    payment_method: "card" | "pix";
    installments?: number;
    payment_response?: Record<string, unknown>;
    /** Quando logado ou quando conta foi criada no checkout; atrela o pedido ao usuário. */
    user_id?: string | null;
    customer: CustomerData;
    shipping: ShippingData;
    /** Preenchido quando um único pedido (configurador direto). */
    specs?: ProductSpecs;
    artwork?: Pick<ArtworkData, "presentationType" | "selectedDesignUrl" | "enhancedDesignUrl" | "approvalScale" | "cutAreaScale"> & { artBase64?: string };
    selectedProduct?: ProductType | null;
    totalPrice?: number;
    shippingCost: number;
    /** Opção de frete escolhida (provider, providerServicoId, etc.) para gerar etiqueta depois */
    shippingOption?: import("@/store/configurator-store").ShippingOptionSnapshot | null;
    /** Quando pago pelo carrinho: um pedido por item. Se presente, specs/artwork/selectedProduct/totalPrice são ignorados no nível raiz. */
    items?: OrderConfirmItem[];
}

/** Linha da tabela pedidos no Supabase. */
export interface PedidoRow {
    id: string;
    order_id_mp: string;
    external_reference: string | null;
    status: string;
    user_id: string | null;
    tracking_code: string | null;
    tracking_url: string | null;
    customer_json: Record<string, unknown>;
    shipping_json: Record<string, unknown>;
    specs_json: Record<string, unknown>;
    artwork_json: Record<string, unknown>;
    product_type: string | null;
    presentation_type: string | null;
    total_price: number | null;
    shipping_cost: number | null;
    shipping_option_json: Record<string, unknown> | null;
    payment_method: string | null;
    installments: number | null;
    payment_response_json: Record<string, unknown> | null;
    package_path: string | null;
    package_generated_at: string | null;
    created_at: string;
    updated_at: string;
}

/** Conteúdo do arquivo Dados_IDpedido.json. */
export interface DadosPedidoJson {
    ID_PEDIDO: string;
    cliente: {
        NOME: string;
        SOBRENOME: string;
        EMAIL: string;
        TELEFONE: string;
        CPF_CNPJ: string;
    };
    endereco_completo: string;
    forma_pagamento: string;
    parcelas?: number;
    produto: {
        TAMANHO_MM: { largura: number; altura: number };
        FORMATO: string;
        QUANTIDADE: number;
        SANGRIA?: string;
        CARTELA_OU_UNIDADES: string;
    };
    totais: {
        valor_produto: number;
        frete: number;
        total: number;
    };
    frete?: {
        provider?: string;
        providerServicoId?: string;
        transportadora?: string;
        nomeServico?: string;
        prazoMinDias?: number;
        prazoMaxDias?: number;
        precoCentavos?: number;
        embalagem?: {
            pesoKg: number;
            comprimentoCm: number;
            larguraCm: number;
            alturaCm: number;
        };
        melhorEnvio?: {
            etiquetaId?: string;
            tracking?: string | null;
            status?: string;
        };
    };
    rastreamento?: Record<string, unknown>;
    /** Total de itens do pedido (carrinho ou 1 no configurador). */
    total_itens?: number;
    /** Índice deste item (0-based) quando há mais de um (carrinho). */
    item_index?: number;
    created_at: string;
}
