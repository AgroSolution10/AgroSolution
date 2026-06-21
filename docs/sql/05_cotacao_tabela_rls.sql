-- =============================================================
-- AgroSolution — Tabela de cotações (Radar de Commodities)
-- =============================================================
-- Objetivo:
--   Guardar as cotações das commodities (soja, milho, boi, café,
--   algodão...) numa tabela, para o Radar deixar de usar dados
--   chumbados no código. O câmbio (USD/BRL) continua vindo ao vivo
--   da AwesomeAPI no app — não precisa ficar aqui.
--
-- Quem escreve nesta tabela?
--   Só o backend (Edge Function com cron, usando a service_role key,
--   que ignora RLS). O app apenas LÊ.
--
-- Rode esse SQL UMA VEZ no painel do Supabase (SQL Editor).
-- =============================================================


-- 1. Tabela de cotações.
--    A PK é um slug estável ('soja', 'milho'...) para o cron poder
--    fazer UPSERT pela chave sem depender de ID gerado.
CREATE TABLE IF NOT EXISTS public.cotacao (
  id            text PRIMARY KEY,
  nome          text NOT NULL,
  unidade       text NOT NULL,
  preco         numeric(12, 2) NOT NULL,
  variacao      numeric(6, 2)  NOT NULL DEFAULT 0,
  categoria     text NOT NULL CHECK (categoria IN ('graos', 'pecuaria', 'cambio')),
  cor           text NOT NULL,
  fonte         text NOT NULL DEFAULT 'manual',
  atualizado_em timestamptz NOT NULL DEFAULT now()
);


-- 2. Row Level Security.
--    Cotação é informação pública de mercado (sem dado pessoal):
--    qualquer usuário logado pode LER. Ninguém escreve via app —
--    INSERT/UPDATE ficam só para a service_role (Edge Function),
--    que passa por cima da RLS.
ALTER TABLE public.cotacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cotacao_select_todos ON public.cotacao;
CREATE POLICY cotacao_select_todos ON public.cotacao
  FOR SELECT
  USING (auth.role() IN ('authenticated', 'anon'));


-- 3. Seed inicial — os mesmos valores de exemplo que estavam no app.
--    ON CONFLICT DO NOTHING: rodar de novo NÃO sobrescreve preços que
--    o cron já tenha atualizado. Para reescrever de propósito, troque
--    por "DO UPDATE SET ...".
INSERT INTO public.cotacao (id, nome, unidade, preco, variacao, categoria, cor, fonte) VALUES
  ('soja',    'Soja',         'R$ / saca 60kg', 142.50,  2.30, 'graos',    '#A3D977', 'CEPEA (exemplo)'),
  ('milho',   'Milho',        'R$ / saca 60kg',  78.90, -0.80, 'graos',    '#FFC107', 'CEPEA (exemplo)'),
  ('algodao', 'Algodão',      'R$ / arroba',     158.20, 1.10, 'graos',    '#E2E8F0', 'CEPEA (exemplo)'),
  ('boi',     'Boi gordo',    'R$ / arroba',     240.50, 0.50, 'pecuaria', '#C49A6C', 'CEPEA (exemplo)'),
  ('cafe',    'Café arábica', 'R$ / saca 60kg', 1845.00, 3.70, 'graos',    '#6F4E37', 'CEPEA (exemplo)')
ON CONFLICT (id) DO NOTHING;


-- =============================================================
-- Pronto. Depois de rodar:
--   - O app passa a LER as commodities desta tabela.
--   - Enquanto o cron de cotações reais não existir, ficam os
--     valores de exemplo acima (e dá pra editá-los na mão pelo
--     Table Editor para testar).
-- =============================================================
