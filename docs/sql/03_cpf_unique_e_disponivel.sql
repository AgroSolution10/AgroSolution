-- =============================================================
-- AgroSolution — CPF/CNPJ único + função de checagem prévia
-- =============================================================
-- Objetivo:
--   1. Garantir, no banco, que CPF/CNPJ não possa ser duplicado.
--   2. Expor uma RPC pública que permita verificar a disponibilidade
--      do CPF/CNPJ ANTES de criar a conta em auth.users.
--
-- Por quê?
--   Antes desta migration, o app criava o usuário no Supabase Auth
--   e SÓ DEPOIS tentava o INSERT em public.usuario. Se o INSERT
--   falhava (CPF duplicado), o registro em auth.users ficava órfão.
--
-- Rode esse SQL UMA VEZ no painel do Supabase (SQL Editor).
-- =============================================================


-- 1. Constraint UNIQUE em cpf_cnpj.
--    Antes de aplicar, normalizamos: removemos pontuação e
--    apagamos eventuais duplicatas pré-existentes (mantém o mais antigo).
UPDATE public.usuario
   SET cpf_cnpj = regexp_replace(cpf_cnpj, '[^0-9]', '', 'g')
 WHERE cpf_cnpj ~ '[^0-9]';

WITH duplicados AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY cpf_cnpj ORDER BY id) AS rn
    FROM public.usuario
   WHERE cpf_cnpj IS NOT NULL AND cpf_cnpj <> ''
)
DELETE FROM public.usuario u
 USING duplicados d
 WHERE u.id = d.id
   AND d.rn > 1;

ALTER TABLE public.usuario
  DROP CONSTRAINT IF EXISTS usuario_cpf_cnpj_unique;

ALTER TABLE public.usuario
  ADD CONSTRAINT usuario_cpf_cnpj_unique UNIQUE (cpf_cnpj);


-- 2. Função RPC para checar disponibilidade do CPF/CNPJ.
--    SECURITY DEFINER → roda como dono da função, ignorando RLS
--    do SELECT, mas devolvendo APENAS um boolean (não vaza dados).
CREATE OR REPLACE FUNCTION public.cpf_cnpj_disponivel(p_cpf_cnpj text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
      FROM public.usuario
     WHERE cpf_cnpj = regexp_replace(coalesce(p_cpf_cnpj, ''), '[^0-9]', '', 'g')
  );
$$;

REVOKE ALL ON FUNCTION public.cpf_cnpj_disponivel(text) FROM public;
GRANT EXECUTE ON FUNCTION public.cpf_cnpj_disponivel(text) TO anon, authenticated;


-- =============================================================
-- Como o app usa:
--   1. Antes de chamar supabase.auth.signUp, chama
--      supabase.rpc('cpf_cnpj_disponivel', { p_cpf_cnpj: cpf }).
--   2. Se retornar false → aborta com mensagem clara, sem criar
--      conta em auth.users.
--   3. Se retornar true → segue o fluxo normal.
-- =============================================================
