-- =============================================================
-- AgroSolution — Cascata de delete: auth.users → public.usuario
-- =============================================================
-- Quando uma linha de auth.users é deletada (pelo painel
-- Authentication → Users ou via API), apaga automaticamente o
-- perfil em public.usuario e seus vínculos em usuario_fazenda.
--
-- Por quê?
--   Antes, ao apagar um usuário pelo painel, o perfil em
--   public.usuario ficava órfão e a verificação de CPF/CNPJ
--   continuava reportando o CPF como "em uso".
--
-- Rode esse SQL UMA VEZ no painel do Supabase (SQL Editor).
-- =============================================================


-- 1. Função que roda quando uma linha de auth.users é deletada.
--    SECURITY DEFINER → roda como dono (postgres), conseguindo
--    apagar mesmo com RLS ativada nas tabelas-alvo.
CREATE OR REPLACE FUNCTION public.fn_apagar_perfil_usuario()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vínculos primeiro, depois o perfil. Idempotente.
  DELETE FROM public.usuario_fazenda WHERE usuario_id = OLD.id;
  DELETE FROM public.usuario          WHERE id          = OLD.id;
  RETURN OLD;
END;
$$;


-- 2. Trigger no schema auth.
DROP TRIGGER IF EXISTS apagar_perfil_usuario ON auth.users;
CREATE TRIGGER apagar_perfil_usuario
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_apagar_perfil_usuario();


-- =============================================================
-- Pronto. A partir de agora, apagar pelo painel Authentication
-- limpa tudo. Para limpar o estado atual (uma única vez):
--
--   TRUNCATE TABLE public.usuario_fazenda,
--                  public.fazenda,
--                  public.usuario
--           RESTART IDENTITY CASCADE;
--
-- (faça isso ANTES de cadastrar de novo e depois de apagar os
-- usuários do painel Authentication.)
-- =============================================================
