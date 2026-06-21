-- =============================================================
-- AgroSolution — Rateio de lançamentos por talhão
-- =============================================================
-- Objetivo:
--   Permitir atribuir cada lançamento (receita/despesa) a talhões,
--   para que cada talhão tenha seu CUSTO e RESULTADO reais.
--
--   Modos de rateio (guardados em lancamento.rateio_modo):
--     - geral         → não atribui a nenhum talhão
--     - especifico    → 100% para 1 talhão
--     - todos         → dividido entre todos (igual OU por área)
--     - personalizado → percentual escolhido por talhão
--
--   O valor de cada talhão é "congelado" na criação (snapshot) na
--   tabela lancamento_talhao, então somar o custo de um talhão é
--   só um SUM — e mudar/excluir um talhão depois não reescreve o
--   histórico.
--
-- Rode esse SQL UMA VEZ no painel do Supabase (SQL Editor).
-- =============================================================


-- 1. Metadados do rateio no próprio lançamento (para reabrir a edição).
ALTER TABLE public.lancamento
  ADD COLUMN IF NOT EXISTS rateio_modo   text,
  ADD COLUMN IF NOT EXISTS rateio_metodo text;

ALTER TABLE public.lancamento
  DROP CONSTRAINT IF EXISTS lancamento_rateio_modo_chk;
ALTER TABLE public.lancamento
  ADD CONSTRAINT lancamento_rateio_modo_chk
  CHECK (rateio_modo IS NULL OR rateio_modo IN ('geral', 'especifico', 'todos', 'personalizado'));


-- 2. Tabela de rateio: parcela concreta (valor) de cada talhão num lançamento.
CREATE TABLE IF NOT EXISTS public.lancamento_talhao (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lancamento_id uuid NOT NULL REFERENCES public.lancamento(id) ON DELETE CASCADE,
  talhao_id     uuid NOT NULL REFERENCES public.talhao(id) ON DELETE CASCADE,
  valor         numeric(14, 2) NOT NULL CHECK (valor >= 0),
  -- percentual é informativo (a soma de `valor` é a fonte da verdade).
  percentual    numeric(6, 2),
  criado_em     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lt_talhao ON public.lancamento_talhao (talhao_id);
CREATE INDEX IF NOT EXISTS idx_lt_lancamento ON public.lancamento_talhao (lancamento_id);


-- 3. RLS — o usuário só acessa o rateio dos próprios lançamentos.
ALTER TABLE public.lancamento_talhao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lt_self ON public.lancamento_talhao;
CREATE POLICY lt_self ON public.lancamento_talhao
  FOR ALL
  USING (
    lancamento_id IN (SELECT id FROM public.lancamento WHERE usuario_id = auth.uid())
  )
  WITH CHECK (
    lancamento_id IN (SELECT id FROM public.lancamento WHERE usuario_id = auth.uid())
  );


-- =============================================================
-- Pronto. Depois de rodar:
--   - O formulário de lançamento ganha o rateio (geral/específico/
--     todos/personalizado).
--   - Cada talhão passa a mostrar custo, receita e resultado reais.
--   - Lançamentos antigos ficam como 'geral' (rateio_modo NULL) —
--     não entram no custo de nenhum talhão até serem reeditados.
-- =============================================================
