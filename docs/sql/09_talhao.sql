-- =============================================================
-- AgroSolution — Talhões (áreas produtivas da fazenda)
-- =============================================================
-- Objetivo:
--   Dar base real ao módulo Talhões. Cada talhão é uma área da
--   fazenda com nome, cultura, tamanho (ha) e um ponto no mapa
--   (lat/long). Polígonos desenháveis ficam para uma fase futura
--   (precisaria de PostGIS / leaflet-draw).
--
--   O talhão pertence a uma fazenda. A RLS libera para os usuários
--   vinculados àquela fazenda (mesmo padrão da tabela `fazenda`).
--
-- Rode esse SQL UMA VEZ no painel do Supabase (SQL Editor).
-- =============================================================


-- 1. Tabela de talhões.
CREATE TABLE IF NOT EXISTS public.talhao (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fazenda_id  uuid NOT NULL REFERENCES public.fazenda(id) ON DELETE CASCADE,
  nome        text NOT NULL,
  cultura     text,
  area_ha     numeric(12, 2) CHECK (area_ha IS NULL OR area_ha > 0),
  latitude    numeric(9, 6),
  longitude   numeric(9, 6),
  criado_em   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_talhao_fazenda ON public.talhao (fazenda_id);


-- 2. Row Level Security — quem é vinculado à fazenda vê/edita os talhões dela.
ALTER TABLE public.talhao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS talhao_membro ON public.talhao;
CREATE POLICY talhao_membro ON public.talhao
  FOR ALL
  USING (
    fazenda_id IN (
      SELECT fazenda_id FROM public.usuario_fazenda WHERE usuario_id = auth.uid()
    )
  )
  WITH CHECK (
    fazenda_id IN (
      SELECT fazenda_id FROM public.usuario_fazenda WHERE usuario_id = auth.uid()
    )
  );


-- =============================================================
-- Pronto. Depois de rodar:
--   - O produtor cadastra talhões na tela Talhões (nome, cultura,
--     área e ponto no mapa).
--   - O app lista os talhões e mostra os pinos no mapa.
-- =============================================================
