-- =============================================================
-- AgroSolution — Lançamentos financeiros (receitas e despesas)
-- =============================================================
-- Objetivo:
--   Dar ao módulo Financeiro uma base real. Hoje o resumo, a
--   evolução e a projeção são chumbados no app. Com esta tabela,
--   o app passa a CALCULAR esses números a partir dos lançamentos
--   do próprio produtor.
--
-- Cada lançamento pertence a um usuário (usuario_id). A RLS garante
-- que cada um só vê/edita os próprios lançamentos.
--
-- Rode esse SQL UMA VEZ no painel do Supabase (SQL Editor).
-- =============================================================


-- 1. Tabela de lançamentos.
CREATE TABLE IF NOT EXISTS public.lancamento (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  uuid NOT NULL REFERENCES public.usuario(id) ON DELETE CASCADE,
  fazenda_id  uuid REFERENCES public.fazenda(id) ON DELETE SET NULL,
  tipo        text NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  categoria   text,
  descricao   text,
  valor       numeric(14, 2) NOT NULL CHECK (valor >= 0),
  data        date NOT NULL DEFAULT current_date,
  criado_em   timestamptz NOT NULL DEFAULT now()
);

-- Índice para as consultas por usuário + período (resumo/evolução).
CREATE INDEX IF NOT EXISTS idx_lancamento_usuario_data
  ON public.lancamento (usuario_id, data);


-- 2. Row Level Security — cada produtor só enxerga os próprios lançamentos.
ALTER TABLE public.lancamento ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lancamento_self ON public.lancamento;
CREATE POLICY lancamento_self ON public.lancamento
  FOR ALL
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());


-- 3. Seed de exemplo — últimos 6 meses, só para usuários que ainda
--    NÃO têm nenhum lançamento (não duplica em re-execução). Assim o
--    Financeiro já abre com números calculados de verdade. Quando você
--    criar a tela de novo lançamento, é só apagar estes ou ignorá-los.
INSERT INTO public.lancamento (usuario_id, tipo, categoria, descricao, valor, data)
SELECT
  u.id,
  x.tipo,
  x.categoria,
  x.descricao,
  x.valor,
  (current_date - (x.meses_atras * interval '1 month'))::date
FROM public.usuario u
CROSS JOIN (VALUES
  ('receita', 'venda',   'Venda de produção',   38000, 5),
  ('despesa', 'insumos', 'Custos operacionais', 22000, 5),
  ('receita', 'venda',   'Venda de produção',   45000, 4),
  ('despesa', 'insumos', 'Custos operacionais', 28000, 4),
  ('receita', 'venda',   'Venda de produção',   41000, 3),
  ('despesa', 'insumos', 'Custos operacionais', 31000, 3),
  ('receita', 'venda',   'Venda de produção',   60000, 2),
  ('despesa', 'insumos', 'Custos operacionais', 35000, 2),
  ('receita', 'venda',   'Venda de produção',   67000, 1),
  ('despesa', 'insumos', 'Custos operacionais', 39000, 1),
  ('receita', 'venda',   'Venda de produção',   52000, 0),
  ('despesa', 'insumos', 'Custos operacionais', 41000, 0)
) AS x(tipo, categoria, descricao, valor, meses_atras)
WHERE NOT EXISTS (
  SELECT 1 FROM public.lancamento l WHERE l.usuario_id = u.id
);


-- =============================================================
-- Pronto. Depois de rodar:
--   - O Financeiro calcula resumo e evolução a partir desta tabela.
--   - Sem lançamentos, o app mostra um exemplo (fallback) para não
--     ficar zerado — vira real assim que houver dados.
-- =============================================================
