/**
 * Serviço de alertas de preço. O produtor cadastra um preço-alvo para uma
 * commodity (ex.: soja acima de R$ 150) e o app compara com a cotação atual.
 *
 * A avaliação ("o alerta bateu?") é feita aqui no cliente, cruzando os alertas
 * com as cotações ao vivo (cotacoes.service) — sem back-end. Push/notificação
 * automática fica para uma fase futura.
 *
 * Ver migration docs/sql/07_alerta.sql.
 */
import { buscarCotacoes } from './cotacoes.service';
import { supabase } from './supabase';

export type Condicao = 'acima' | 'abaixo';

/** Dados que a tela de "novo alerta" envia. */
export type NovoAlerta = {
  commodityId: string;
  commodityNome: string;
  condicao: Condicao;
  alvo: number;
};

/** Um alerta gravado. */
export type Alerta = {
  id: string;
  commodityId: string;
  commodityNome: string;
  condicao: Condicao;
  alvo: number;
  ativo: boolean;
};

/** Alerta enriquecido com a cotação atual e se já foi atingido. */
export type AlertaComStatus = Alerta & {
  /** Preço atual da commodity, ou null se não há cotação para ela. */
  precoAtual: number | null;
  /** true quando a condição já está satisfeita pelo preço atual. */
  atingido: boolean;
};

/** Cria um alerta para o usuário logado (RLS exige usuario_id = auth.uid()). */
export async function criarAlerta(novo: NovoAlerta): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado.');

  const { data: auth } = await supabase.auth.getUser();
  const usuarioId = auth.user?.id;
  if (!usuarioId) throw new Error('Sessão expirada. Entre novamente.');

  const { error } = await supabase.from('alerta').insert({
    usuario_id: usuarioId,
    commodity_id: novo.commodityId,
    commodity_nome: novo.commodityNome,
    condicao: novo.condicao,
    alvo: novo.alvo,
  });
  if (error) throw new Error(error.message);
}

/** Exclui um alerta. A RLS impede apagar o de outra pessoa. */
export async function excluirAlerta(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase.from('alerta').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

async function listarAlertas(): Promise<Alerta[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('alerta')
    .select('id, commodity_id, commodity_nome, condicao, alvo, ativo')
    .order('criado_em', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((a) => ({
    id: a.id,
    commodityId: a.commodity_id,
    commodityNome: a.commodity_nome,
    condicao: a.condicao as Condicao,
    alvo: Number(a.alvo),
    ativo: a.ativo,
  }));
}

/**
 * Carrega os alertas do usuário já avaliados contra as cotações atuais.
 * Busca alertas e cotações em paralelo e calcula, para cada alerta, o preço
 * atual da commodity e se a condição foi atingida.
 */
export async function carregarAlertas(): Promise<AlertaComStatus[]> {
  try {
    const [alertas, cotacoes] = await Promise.all([listarAlertas(), buscarCotacoes()]);
    const precoPorId = new Map(cotacoes.map((c) => [c.id, c.preco]));

    return alertas.map((a) => {
      const precoAtual = precoPorId.get(a.commodityId) ?? null;
      const atingido =
        a.ativo && precoAtual !== null
          ? a.condicao === 'acima'
            ? precoAtual >= a.alvo
            : precoAtual <= a.alvo
          : false;
      return { ...a, precoAtual, atingido };
    });
  } catch (erro) {
    console.warn('[alertas] falha ao carregar alertas:', erro);
    return [];
  }
}
