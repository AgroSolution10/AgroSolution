-- =============================================================
-- AgroSolution — Localização da fazenda (lat/long)
-- =============================================================
-- Objetivo:
--   Guardar a coordenada da fazenda para os alertas de CLIMA.
--   A lat/long já é capturada no cadastro (Passo 3, no mapa), mas
--   até agora não era salva. Com estas colunas, o app consegue
--   buscar a previsão do tempo do local certo (via Open-Meteo).
--
-- Rode esse SQL UMA VEZ no painel do Supabase (SQL Editor).
--
-- Para uma fazenda que já existe e está sem coordenada, dá para
-- preencher na mão pelo Table Editor (ou re-cadastrar) — aí os
-- alertas de clima passam a funcionar para aquele usuário.
-- =============================================================

ALTER TABLE public.fazenda
  ADD COLUMN IF NOT EXISTS latitude  numeric(9, 6),
  ADD COLUMN IF NOT EXISTS longitude numeric(9, 6);

-- (Opcional) sanidade dos valores quando preenchidos.
ALTER TABLE public.fazenda
  DROP CONSTRAINT IF EXISTS fazenda_lat_range;
ALTER TABLE public.fazenda
  ADD CONSTRAINT fazenda_lat_range
  CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90);

ALTER TABLE public.fazenda
  DROP CONSTRAINT IF EXISTS fazenda_long_range;
ALTER TABLE public.fazenda
  ADD CONSTRAINT fazenda_long_range
  CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180);

-- =============================================================
-- Pronto. Depois de rodar:
--   - Novos cadastros salvam a coordenada automaticamente.
--   - O app lê a coordenada e busca a previsão do tempo.
--   - Sem coordenada, os alertas de clima ficam desativados
--     (o resto dos alertas continua funcionando normalmente).
-- =============================================================
