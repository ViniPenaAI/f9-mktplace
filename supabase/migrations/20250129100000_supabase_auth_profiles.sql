-- ============================================================
-- Fase 3: Supabase Auth + profiles (substitui tabela users)
-- ============================================================
-- auth.users é gerenciado pelo Supabase Auth.
-- profiles armazena dados extras (nome, phone, document, etc.)
-- e é o ponto de referência para user_addresses, carts, pedidos.

-- 1) Criar tabela profiles (id = auth.users.id)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    phone TEXT,
    document TEXT,
    document_type TEXT CHECK (document_type IN ('cpf', 'cnpj')),
    razao_social TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) Remover FKs que apontam para public.users
ALTER TABLE public.user_addresses
    DROP CONSTRAINT IF EXISTS user_addresses_user_id_fkey;

ALTER TABLE public.carts
    DROP CONSTRAINT IF EXISTS carts_user_id_fkey;

ALTER TABLE public.funnel_events
    DROP CONSTRAINT IF EXISTS funnel_events_user_id_fkey;

ALTER TABLE public.pedidos
    DROP CONSTRAINT IF EXISTS pedidos_user_id_fkey;

-- 3) Remover tabela users (auth fica em auth.users)
DROP TRIGGER IF EXISTS users_updated_at ON public.users;
DROP TABLE IF EXISTS public.users;

-- 4) Recriar FKs apontando para profiles
ALTER TABLE public.user_addresses
    ADD CONSTRAINT user_addresses_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.carts
    ADD CONSTRAINT carts_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.funnel_events
    ADD CONSTRAINT funnel_events_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.pedidos
    ADD CONSTRAINT pedidos_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 5) RLS: usuário só acessa o próprio profile
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário pode ver próprio profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Usuário pode atualizar próprio profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Inserção em profiles só via service role (API após signUp); sem policy = só admin.

-- 6) RLS em user_addresses (usuário vê/edita só os próprios)
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê próprios endereços"
    ON public.user_addresses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuário insere próprio endereço"
    ON public.user_addresses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário atualiza próprio endereço"
    ON public.user_addresses FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuário remove próprio endereço"
    ON public.user_addresses FOR DELETE
    USING (auth.uid() = user_id);
