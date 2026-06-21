-- =============================================================
-- AgroSolution — Alertas de preço (preço-alvo por commodity)
-- =============================================================
-- Objetivo:
--   Dar base real ao módulo de Alertas. O produtor define um
--   preço-alvo para uma commodity (ex.: "me avise quando a soja
--   passar de R$ 150") e o app compara com a cotação atual.
--
--   A avaliação (se o alerta "bateu") é feita no app, comparando
--   o alvo com a cotação ao vivo — não precisa de cron/back-end
--   para o MVP. Esta tabela só guarda os alertas configurados.
--
-- Cada alerta pertence a um usuário (usuario_id) — RLS self-only.
--
-- Rode esse SQL UMA VEZ no painel do Supabase (SQL Editor).
-- =============================================================


-- 1. Tabela de alertas.
CREATE TABLE IF NOT EXISTS public.alerta (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id      uuid NOT NULL REFERENCES public.usuario(id) ON DELETE CASCADE,
  -- Slug da commodity, igual ao id da tabela `cotacao` ('soja', 'milho'...).
  commodity_id    text NOT NULL,
  -- Nome no momento da criação, para exibir sem depender de join.
  commodity_nome  text NOT NULL,
  condicao        text NOT NULL CHECK (condicao IN ('acima', 'abaixo')),
  alvo            numeric(14, 2) NOT NULL CHECK (alvo > 0),
  ativo           boolean NOT NULL DEFAULT true,
  criado_em       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alerta_usuario ON public.alerta (usuario_id);


-- 2. Row Level Security — cada produtor só vê/edita os próprios alertas.
ALTER TABLE public.alerta ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS alerta_self ON public.alerta;
CREATE POLICY alerta_self ON public.alerta
  FOR ALL
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());


-- =============================================================
-- Pronto. Depois de rodar:
--   - O produtor cria alertas na tela Alertas.
--   - O app compara cada alerta com a cotação atual e mostra
--     quais já foram atingidos (sem precisar de back-end).
--   - Push/notificação automática fica para uma fase futura
--     (aí sim com Edge Function + cron + expo-notifications).
-- =============================================================
