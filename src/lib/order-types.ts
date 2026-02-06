import type { CustomerData, ShippingData, ProductSpecs, ArtworkData } from "@/store/configurator-store";
import type { ProductType } from "@/store/configurator-store";
import type { PresentationType } from "@/store/configurator-store";

/** Payload enviado pelo front ao confirmar pedido (após sucesso do pagamento). */
export interface OrderConfirmBody {
    order_id: string;
    status: string;
    payment_method: "card" | "pix";
    installments?: number;
    payment_response?: Record<string, unknown>;
    customer: CustomerData;
    shipping: ShippingData;
    specs: ProductSpecs;
    /** Arte serializável (sem File); URLs e presentationType. */
    artwork: Pick<ArtworkData, "presentationType" | "selectedDesignUrl" | "enhancedDesignUrl" | "approvalScale" | "cutAreaScale"> & { artBase64?: string };
    selectedProduct: ProductType | null;
    totalPrice: number;
    shippingCost: number;
}

/** Linha da tabela pedidos no Supabase. */
export interface PedidoRow {
    id: string;
    order_id_mp: string;
    external_reference: string | null;
    status: string;
    customer_json: Record<string, unknown>;
    shipping_json: Record<string, unknown>;
    specs_json: Record<string, unknown>;
    artwork_json: Record<string, unknown>;
    product_type: string | null;
    presentation_type: string | null;
    total_price: number | null;
    shipping_cost: number | null;
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
    rastreamento?: Record<string, unknown>;
    created_at: string;
}
