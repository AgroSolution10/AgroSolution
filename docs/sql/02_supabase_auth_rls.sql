-- =============================================================
-- AgroSolution — Configuração do Supabase Auth + RLS
-- =============================================================
-- Rode esse SQL UMA VEZ no painel do Supabase:
--   1. Entre no seu projeto -> menu lateral -> SQL Editor
--   2. Clique em "+ New query"
--   3. Cole TODO o conteúdo abaixo
--   4. Clique em "Run" (ou Ctrl+Enter)
-- =============================================================


-- 1. Senha agora é gerenciada pelo Supabase Auth (auth.users).
--    A coluna senha_hash não é mais obrigatória.
ALTER TABLE public.usuario
  ALTER COLUMN senha_hash DROP NOT NULL;


-- 2. Habilita Row Level Security (RLS) nas tabelas do app.
--    Sem RLS, qualquer pessoa com a anon key poderia ler/escrever tudo.
ALTER TABLE public.usuario          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fazenda          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario_fazenda  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispositivo      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessao           ENABLE ROW LEVEL SECURITY;


-- 3. Políticas para a tabela `usuario`
--    Cada produtor só vê e edita o próprio perfil.
DROP POLICY IF EXISTS usuario_select_self ON public.usuario;
CREATE POLICY usuario_select_self ON public.usuario
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS usuario_insert_self ON public.usuario;
CREATE POLICY usuario_insert_self ON public.usuario
  FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS usuario_update_self ON public.usuario;
CREATE POLICY usuario_update_self ON public.usuario
  FOR UPDATE
  USING (auth.uid() = id);


-- 4. Políticas para a tabela `fazenda`
--    Quem vê: apenas usuários vinculados via usuario_fazenda.
--    Quem cria: qualquer usuário autenticado (vai virar dono na sequência).
DROP POLICY IF EXISTS fazenda_select_membro ON public.fazenda;
CREATE POLICY fazenda_select_membro ON public.fazenda
  FOR SELECT
  USING (
    id IN (
      SELECT fazenda_id
      FROM public.usuario_fazenda
      WHERE usuario_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS fazenda_insert_autenticado ON public.fazenda;
CREATE POLICY fazenda_insert_autenticado ON public.fazenda
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS fazenda_update_owner ON public.fazenda;
CREATE POLICY fazenda_update_owner ON public.fazenda
  FOR UPDATE
  USING (
    id IN (
      SELECT fazenda_id
      FROM public.usuario_fazenda
      WHERE usuario_id = auth.uid() AND papel = 'owner'
    )
  );


-- 5. Políticas para `usuario_fazenda`
--    Cada usuário só vê e cria os próprios vínculos.
DROP POLICY IF EXISTS uf_select_self ON public.usuario_fazenda;
CREATE POLICY uf_select_self ON public.usuario_fazenda
  FOR SELECT
  USING (usuario_id = auth.uid());

DROP POLICY IF EXISTS uf_insert_self ON public.usuario_fazenda;
CREATE POLICY uf_insert_self ON public.usuario_fazenda
  FOR INSERT
  WITH CHECK (usuario_id = auth.uid());


-- 6. Políticas para `dispositivo` e `sessao` (usadas mais pra frente)
DROP POLICY IF EXISTS dispositivo_self ON public.dispositivo;
CREATE POLICY dispositivo_self ON public.dispositivo
  FOR ALL
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

DROP POLICY IF EXISTS sessao_self ON public.sessao;
CREATE POLICY sessao_self ON public.sessao
  FOR ALL
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());


-- =============================================================
-- Pronto! Depois de rodar:
--   - usuário se cadastra → Auth cria o login + perfil é gravado em `usuario`
--   - usuário só vê os próprios dados (RLS protege automaticamente)
--   - dá pra remover esse arquivo do git? não, ele documenta a migration
-- =============================================================
