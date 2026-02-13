-- Tabelas de preços: materiais e produtos.
-- Assim você altera valores pelo Supabase (Table Editor) sem mexer no código na hospedagem.
-- Execute no SQL Editor do Supabase.

-- Tipos de produto: taxa por m² e preço mínimo (em R$)
CREATE TABLE IF NOT EXISTS public.preco_produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo TEXT NOT NULL UNIQUE,
    label TEXT,
    taxa_por_m2 NUMERIC(12,4) NOT NULL DEFAULT 150,
    preco_minimo NUMERIC(12,2) NOT NULL DEFAULT 50,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Materiais + acabamento: multiplicador aplicado sobre o valor do produto (ex: 1.0 = sem alteração, 1.2 = +20%)
CREATE TABLE IF NOT EXISTS public.preco_materiais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material TEXT NOT NULL,
    finish TEXT NOT NULL,
    label TEXT,
    multiplicador NUMERIC(8,4) NOT NULL DEFAULT 1,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(material, finish)
);

-- Trigger updated_at para as duas tabelas
DROP TRIGGER IF EXISTS preco_produtos_updated_at ON public.preco_produtos;
CREATE TRIGGER preco_produtos_updated_at
    BEFORE UPDATE ON public.preco_produtos
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS preco_materiais_updated_at ON public.preco_materiais;
CREATE TRIGGER preco_materiais_updated_at
    BEFORE UPDATE ON public.preco_materiais
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Valores iniciais (equivalentes ao que está no código hoje)
INSERT INTO public.preco_produtos (tipo, label, taxa_por_m2, preco_minimo) VALUES
    ('rotulo', 'Rótulos', 150, 50),
    ('banner', 'Banners', 150, 50),
    ('faixa', 'Faixas', 150, 50),
    ('adesivo', 'Adesivos', 150, 50),
    ('outros', 'Outros', 150, 50)
ON CONFLICT (tipo) DO NOTHING;

INSERT INTO public.preco_materiais (material, finish, label, multiplicador) VALUES
    ('vinyl_white', 'gloss', 'Vinil branco brilho', 1),
    ('vinyl_white', 'matte', 'Vinil branco fosco', 1.1),
    ('vinyl_transparent', 'gloss', 'Vinil transparente brilho', 1.2),
    ('vinyl_transparent', 'matte', 'Vinil transparente fosco', 1.32),
    ('bopp', 'gloss', 'BOPP brilho', 1),
    ('bopp', 'matte', 'BOPP fosco', 1.1),
    ('paper_couche', 'gloss', 'Papel couchê brilho', 1),
    ('paper_couche', 'matte', 'Papel couchê fosco', 1.1)
ON CONFLICT (material, finish) DO NOTHING;
