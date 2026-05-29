import { getSupabaseClient } from './supabase';
import { onlyDigits } from '@/utils/masks';
import type { CadastroDados, Cultura, Usuario } from '@/screens/auth/cadastro/types';

type LoginPayload = {
  email: string;
  senha: string;
};

/**
 * Cadastro completo (só roda após o aceite explícito dos Termos + LGPD):
 *  1. Valida que o CPF/CNPJ está disponível antes de tocar no Auth.
 *  2. Cria conta no Supabase Auth com a trilha de consentimento em user_metadata.
 *  3. Insere o registro do produtor em `public.usuario`.
 *  4. Cria a fazenda em `public.fazenda`.
 *  5. Vincula o produtor à fazenda em `public.usuario_fazenda` como "owner".
 */
export async function cadastrarUsuario(dados: CadastroDados): Promise<Usuario> {
  const supabase = getSupabaseClient();
  const nome = (dados.nome ?? '').trim();
  const email = (dados.email ?? '').trim().toLowerCase();
  const senha = dados.senha ?? '';
  const cpfCnpj = onlyDigits(dados.cpfCnpj ?? '');

  if (!nome || !email || !senha || !cpfCnpj) {
    throw new Error('Dados de cadastro incompletos.');
  }

  // Trava jurídica (LGPD): sem aceite explícito dos termos e da
  // política de privacidade não criamos absolutamente nada.
  if (!dados.aceiteTermos || !dados.aceitePrivacidade) {
    throw new Error('É preciso aceitar os Termos de Uso e a Política de Privacidade.');
  }

  // 1. Antes de criar qualquer coisa, checa se o CPF/CNPJ já está em uso.
  //    Evita criar um auth.users órfão se o INSERT em public.usuario fosse
  //    falhar mais à frente pela constraint UNIQUE.
  const { data: disponivel, error: erroCheck } = await supabase.rpc(
    'cpf_cnpj_disponivel',
    { p_cpf_cnpj: cpfCnpj },
  );

  if (erroCheck) {
    console.error('[cadastro] erro ao checar CPF/CNPJ:', erroCheck);
    throw new Error(traduzirErro(erroCheck.message));
  }
  if (disponivel === false) {
    throw new Error('Esse CPF/CNPJ já está cadastrado em outra conta.');
  }

  // 2. Cria a conta no Supabase Auth.
  //    Guardamos no user_metadata uma trilha mínima do consentimento
  //    LGPD: data/hora e versão dos termos aceitos.
  const consentimentoEm = new Date().toISOString();
  const { data: auth, error: erroAuth } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: {
        nome,
        cpf_cnpj: cpfCnpj,
        aceite_termos_em: consentimentoEm,
        aceite_privacidade_em: consentimentoEm,
        aceite_versao: '2026-05-22',
      },
    },
  });

  if (erroAuth) throw new Error(traduzirErro(erroAuth.message));
  if (!auth.user) throw new Error('Não foi possível criar a conta.');

  // Truque do Supabase: quando o e-mail já existe em auth.users, o signUp
  // não dá erro (pra evitar enumeração de e-mails), mas retorna identities
  // como array vazio. Usamos isso pra detectar e abortar antes do INSERT.
  if (Array.isArray(auth.user.identities) && auth.user.identities.length === 0) {
    throw new Error('Esse e-mail já está cadastrado. Faça login para continuar.');
  }

  const userId = auth.user.id;

  // 3. Insere o perfil na tabela usuario.
  //    Edição posterior será feita em uma tela de "Meu perfil" (UPDATE),
  //    não aqui — cadastro só cria.
  const { error: erroUsuario } = await supabase.from('usuario').insert({
    id: userId,
    nome,
    email,
    cpf_cnpj: cpfCnpj,
    perfil: 'produtor',
  });

  if (erroUsuario) {
    // Loga tudo que o Supabase devolveu pra ajudar a diagnosticar
    console.error('[cadastro] erro ao inserir em usuario:', erroUsuario);
    throw new Error(traduzirErro(erroUsuario.message, erroUsuario.details));
  }

  // 4. Cria a fazenda (se temos área e cultura)
  //    Geramos o UUID no cliente para evitar `INSERT...RETURNING id`, que
  //    dispara a política de SELECT antes do vínculo existir (paradoxo da galinha).
  const culturas = (dados.culturas ?? []) as Cultura[];
  const areaTotal = parseFloat((dados.areaTotal ?? '').replace(',', '.'));

  if (culturas.length > 0 && Number.isFinite(areaTotal) && areaTotal > 0) {
    const fazendaId = gerarUuid();

    const { error: erroFazenda } = await supabase.from('fazenda').insert({
      id: fazendaId,
      nome: `Fazenda de ${nome.split(' ')[0]}`,
      area_total_ha: areaTotal,
      cultura_principal: culturas[0],
    });

    if (erroFazenda) throw new Error(traduzirErro(erroFazenda.message));

    // 5. Vincula como dono usando o UUID que já temos
    const { error: erroVinculo } = await supabase.from('usuario_fazenda').insert({
      usuario_id: userId,
      fazenda_id: fazendaId,
      papel: 'owner',
    });
    if (erroVinculo) throw new Error(traduzirErro(erroVinculo.message));
  }

  return {
    nome,
    email,
    culturas,
    areaTotal: dados.areaTotal,
  };
}

/**
 * Login com e-mail e senha. Devolve dados do usuário + 1ª fazenda associada.
 */
export async function login({ email, senha }: LoginPayload): Promise<Usuario> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: senha,
  });

  if (error) throw new Error(traduzirErro(error.message));
  if (!data.user) throw new Error('Falha no login.');

  return await carregarUsuario(data.user.id);
}

/** Encerra a sessão atual no Supabase. */
export async function logout(): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase.auth.signOut();
}

/** Verifica se há sessão ativa e devolve os dados do usuário (ou null). */
export async function getSessao(): Promise<Usuario | null> {
  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user) return null;
  try {
    return await carregarUsuario(data.session.user.id);
  } catch {
    return null;
  }
}

async function carregarUsuario(userId: string): Promise<Usuario> {
  const supabase = getSupabaseClient();
  const { data: usuario, error } = await supabase
    .from('usuario')
    .select('nome, email')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw new Error(traduzirErro(error.message));
  if (!usuario) throw new Error('Perfil de usuário não encontrado.');

  // Pega a 1ª fazenda associada
  const { data: vinculos } = await supabase
    .from('usuario_fazenda')
    .select('fazenda:fazenda_id(area_total_ha, cultura_principal)')
    .eq('usuario_id', userId)
    .limit(1);

  const fazenda = (vinculos?.[0] as { fazenda: { area_total_ha?: number; cultura_principal?: string } | null } | undefined)
    ?.fazenda;
  const cultura = fazenda?.cultura_principal as Cultura | undefined;

  return {
    nome: usuario.nome,
    email: usuario.email,
    culturas: cultura ? [cultura] : [],
    areaTotal: fazenda?.area_total_ha?.toString(),
  };
}

/** Traduz mensagens comuns do Supabase pra português. */
function traduzirErro(mensagem: string, detalhes?: string | null): string {
  const m = (mensagem ?? '').toLowerCase();
  const d = (detalhes ?? '').toLowerCase();
  const tudo = `${m} ${d}`;

  if (tudo.includes('user already registered') || tudo.includes('already been registered')) {
    return 'Esse e-mail já está cadastrado. Faça login ou use outro e-mail.';
  }
  if (tudo.includes('duplicate key') || tudo.includes('already exists')) {
    if (tudo.includes('cpf_cnpj')) return 'Esse CPF/CNPJ já está cadastrado em outra conta.';
    if (tudo.includes('email')) return 'Esse e-mail já está cadastrado em outra conta.';
    if (tudo.includes('usuario_pkey')) return 'Já existe um perfil para essa conta.';
    return 'Já existe um cadastro com esses dados.';
  }
  if (m.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (m.includes('email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar.';
  }
  if (m.includes('password should be') || m.includes('password is too short')) {
    return 'A senha precisa ter no mínimo 6 caracteres.';
  }
  if (m.includes('row-level security')) {
    return 'Permissão negada pelo banco. Verifique se rodou o SQL de RLS no Supabase.';
  }
  if (m.includes('failed to fetch') || m.includes('network')) {
    return 'Sem conexão com o servidor. Verifique sua internet.';
  }
  return mensagem;
}

/**
 * Gera um UUID v4. Usa crypto.randomUUID() quando disponível (web/Node 18+),
 * com fallback simples baseado em Math.random.
 */
function gerarUuid(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
