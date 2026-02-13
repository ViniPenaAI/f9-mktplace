-- ============================================================
-- LIMPEZA: remover tabelas da ferramenta anterior não usadas
-- pelo projeto F9 (configurador, carrinho, pedidos, usuários).
-- Execute no SQL Editor do Supabase.
-- ============================================================
-- MANTER: pedidos, etiquetas_frete, preco_produtos, preco_materiais,
--         users, user_addresses, carts, cart_items, funnel_events
--
-- Após rodar este script, confira se já executou a migration
-- 20250128200000_users_carts_funnel.sql (users, user_addresses,
-- carts, cart_items, funnel_events, alter pedidos). Se a tabela
-- "users" veio da ferramenta antiga e não tem coluna password_hash,
-- apague antes: DROP TABLE IF EXISTS user_addresses CASCADE;
-- DROP TABLE IF EXISTS users CASCADE; depois rode a migration.
-- ============================================================

-- Tabelas de junção (product_*) e tabelas de catálogo/config antigas
DROP TABLE IF EXISTS public.product_finishes CASCADE;
DROP TABLE IF EXISTS public.product_formats CASCADE;
DROP TABLE IF EXISTS public.product_materials CASCADE;
DROP TABLE IF EXISTS public.product_predefined_sizes CASCADE;

-- Tabelas de catálogo/config da ferramenta anterior
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.templates CASCADE;
DROP TABLE IF EXISTS public.price_rules CASCADE;
DROP TABLE IF EXISTS public.finishes CASCADE;
DROP TABLE IF EXISTS public.formats CASCADE;
DROP TABLE IF EXISTS public.materials CASCADE;
DROP TABLE IF EXISTS public.predefined_sizes CASCADE;
DROP TABLE IF EXISTS public.backgrounds CASCADE;
