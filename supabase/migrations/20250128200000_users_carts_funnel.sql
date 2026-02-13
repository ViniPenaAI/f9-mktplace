-- ============================================================
-- USUÁRIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    document TEXT,
    document_type TEXT CHECK (document_type IN ('cpf', 'cnpj')),
    razao_social TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ============================================================
-- ENDEREÇOS DO USUÁRIO
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    label TEXT,
    zip_code TEXT,
    street TEXT,
    number TEXT,
    complement TEXT,
    neighborhood TEXT,
    city TEXT,
    state TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON public.user_addresses(user_id);

-- ============================================================
-- CARRINHO
-- ============================================================
CREATE TABLE IF NOT EXISTS public.carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    session_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_carts_user_id ON public.carts(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_carts_session_id ON public.carts(session_id) WHERE session_id IS NOT NULL;

-- ============================================================
-- ITENS DO CARRINHO
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
    product_type TEXT NOT NULL,
    product_label TEXT NOT NULL,
    specs_json JSONB NOT NULL DEFAULT '{}',
    artwork_json JSONB NOT NULL DEFAULT '{}',
    art_base64 TEXT,
    unit_price NUMERIC(12,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);

-- ============================================================
-- RASTREIO DE ETAPAS (FUNIL)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.funnel_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    step INTEGER NOT NULL,
    step_label TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_funnel_events_session ON public.funnel_events(session_id);
CREATE INDEX IF NOT EXISTS idx_funnel_events_step ON public.funnel_events(step);
CREATE INDEX IF NOT EXISTS idx_funnel_events_created ON public.funnel_events(created_at DESC);

-- ============================================================
-- ALTERAÇÃO EM PEDIDOS (user_id + rastreio)
-- ============================================================
ALTER TABLE public.pedidos
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS tracking_code TEXT,
    ADD COLUMN IF NOT EXISTS tracking_url TEXT;

CREATE INDEX IF NOT EXISTS idx_pedidos_user_id ON public.pedidos(user_id) WHERE user_id IS NOT NULL;

-- ============================================================
-- TRIGGERS updated_at
-- ============================================================
DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS user_addresses_updated_at ON public.user_addresses;
CREATE TRIGGER user_addresses_updated_at BEFORE UPDATE ON public.user_addresses
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS carts_updated_at ON public.carts;
CREATE TRIGGER carts_updated_at BEFORE UPDATE ON public.carts
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
