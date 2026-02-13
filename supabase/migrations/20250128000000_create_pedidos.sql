-- Tabela de pedidos (fonte para impressão + ERP/planilha)
-- Execute no SQL Editor do Supabase: https://supabase.com/dashboard/project/_/sql

CREATE TABLE IF NOT EXISTS public.pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id_mp TEXT NOT NULL UNIQUE,
    external_reference TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    -- Dados serializados do cliente, envio, specs e arte (para compilação)
    customer_json JSONB NOT NULL DEFAULT '{}',
    shipping_json JSONB NOT NULL DEFAULT '{}',
    specs_json JSONB NOT NULL DEFAULT '{}',
    artwork_json JSONB NOT NULL DEFAULT '{}',
    product_type TEXT,
    presentation_type TEXT,
    total_price NUMERIC(12,2),
    shipping_cost NUMERIC(12,2),
    payment_method TEXT,
    installments INTEGER,
    payment_response_json JSONB,
    -- Pasta compilada no Storage (ex: pedidos/12345/)
    package_path TEXT,
    package_generated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_order_id_mp ON public.pedidos(order_id_mp);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON public.pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at ON public.pedidos(created_at DESC);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Nota: no Dashboard do Supabase (Storage), crie o bucket "pedidos" (privado).

DROP TRIGGER IF EXISTS pedidos_updated_at ON public.pedidos;
CREATE TRIGGER pedidos_updated_at
    BEFORE UPDATE ON public.pedidos
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Bucket de storage: crie manualmente no Supabase Dashboard > Storage:
-- Nome: pedidos
-- Público: não (apenas service_role / RLS permitindo leitura para sua app)
