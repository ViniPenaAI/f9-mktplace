-- Etiquetas de frete (Melhor Envio / SuperFrete) vinculadas ao pedido
CREATE TABLE IF NOT EXISTS public.etiquetas_frete (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    provider_etiqueta_id TEXT NOT NULL,
    url_impressao TEXT,
    codigo_rastreio TEXT,
    status TEXT NOT NULL DEFAULT 'AGUARDANDO_POSTAGEM',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(pedido_id)
);

CREATE INDEX IF NOT EXISTS idx_etiquetas_frete_pedido_id ON public.etiquetas_frete(pedido_id);
CREATE INDEX IF NOT EXISTS idx_etiquetas_frete_provider_id ON public.etiquetas_frete(provider, provider_etiqueta_id);

DROP TRIGGER IF EXISTS etiquetas_frete_updated_at ON public.etiquetas_frete;
CREATE TRIGGER etiquetas_frete_updated_at
    BEFORE UPDATE ON public.etiquetas_frete
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Opção de frete escolhida no pedido (para gerar etiqueta depois)
ALTER TABLE public.pedidos
ADD COLUMN IF NOT EXISTS shipping_option_json JSONB;

COMMENT ON COLUMN public.pedidos.shipping_option_json IS 'Opção de frete escolhida: provider, providerServicoId, preco, nomeServico, etc.';
