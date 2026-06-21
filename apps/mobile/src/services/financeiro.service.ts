/**
 * Serviço financeiro — agrega os lançamentos (tabela `lancamento`) nos números
 * que o módulo Financeiro mostra: resumo do mês e evolução dos últimos 6 meses.
 *
 * Mesma filosofia do serviço de cotações: a UI nunca calcula nem consulta o
 * banco direto. Se o Supabase não estiver configurado, a tabela não existir ou
 * o usuário ainda não tiver lançamentos, devolve um exemplo (fallback) para o
 * painel não ficar zerado — vira real assim que houver dados.
 *
 * Ver migration docs/sql/06_lancamento_financeiro.sql.
 */
import type { FiltroPeriodo } from '@/components/FiltrosPeriodo';
import type { Alocacao, MetodoDivisao, ModoRateio } from '@/utils/rateio';
import { supabase } from './supabase';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export type ResumoFinanceiro = {
  /** Rótulo do período selecionado (ex.: "Jun · 2026", "Últimos 3 meses", "2026"). */
  mesLabel: string;
  receita: number;
  custos: number;
  lucro: number;
  /** Variação % do lucro vs. período anterior (null se não dá para comparar). */
  variacaoLucro: number | null;
  /** Texto da comparação (ex.: "vs. mês anterior", "vs. ano anterior"). */
  comparacao: string;
  /** true quando os números são exemplo (sem lançamentos no banco). */
  exemplo: boolean;
};

export type PontoEvolucao = { mes: string; receita: number; despesa: number };

export type TipoLancamento = 'receita' | 'despesa';

/** Rateio (atribuição a talhões) que acompanha um lançamento. */
export type RateioInput = {
  modo: ModoRateio;
  metodo?: MetodoDivisao;
  alocacoes: Alocacao[];
};

/** Dados que a tela de "novo lançamento" envia. */
export type NovoLancamento = {
  tipo: TipoLancamento;
  valor: number;
  descricao?: string;
  categoria?: string;
  /** 'YYYY-MM-DD'. Se omitido, o banco usa a data de hoje. */
  data?: string;
  /** Rateio por talhão (ausente = geral / não atribuído). */
  rateio?: RateioInput;
};

/** Um lançamento já gravado, como vem do banco para listas. */
export type LancamentoItem = {
  id: string;
  tipo: TipoLancamento;
  descricao: string | null;
  categoria: string | null;
  valor: number;
  data: string;
  rateioModo: ModoRateio | null;
  rateioMetodo: MetodoDivisao | null;
};

type LinhaLancamento = {
  tipo: 'receita' | 'despesa';
  valor: number;
  ano: number;
  mes: number;
  /** Data completa 'YYYY-MM-DD' — usada na projeção diária. */
  data: string;
};

// ---- Fallbacks (mesmos valores de exemplo que estavam chumbados na UI) ----

const RESUMO_FALLBACK: ResumoFinanceiro = {
  mesLabel: rotuloMesAtual(),
  receita: 412000,
  custos: 227480,
  lucro: 184520,
  variacaoLucro: 12.4,
  comparacao: 'vs. mês anterior',
  exemplo: true,
};

const EVOLUCAO_FALLBACK: PontoEvolucao[] = [
  { mes: 'Dez', receita: 38000, despesa: 22000 },
  { mes: 'Jan', receita: 45000, despesa: 28000 },
  { mes: 'Fev', receita: 41000, despesa: 31000 },
  { mes: 'Mar', receita: 60000, despesa: 35000 },
  { mes: 'Abr', receita: 67000, despesa: 39000 },
  { mes: 'Mai', receita: 52000, despesa: 41000 },
];

/**
 * Lê os lançamentos do usuário logado (a RLS já filtra por auth.uid()).
 * Devolve null quando não há como buscar — quem chama decide o fallback.
 */
async function buscarLancamentos(): Promise<LinhaLancamento[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('lancamento').select('tipo, valor, data');
    if (error) throw error;
    if (!data) return [];
    return data.map((l) => {
      const data_ = String(l.data); // 'YYYY-MM-DD'
      return {
        tipo: l.tipo as 'receita' | 'despesa',
        valor: Number(l.valor),
        ano: Number(data_.slice(0, 4)),
        mes: Number(data_.slice(5, 7)) - 1, // 0-11
        data: data_,
      };
    });
  } catch (erro) {
    console.warn('[financeiro] falha ao ler lançamentos, usando exemplo:', erro);
    return null;
  }
}

function somaMes(lancamentos: LinhaLancamento[], ano: number, mes: number, tipo: 'receita' | 'despesa') {
  return lancamentos
    .filter((l) => l.ano === ano && l.mes === mes && l.tipo === tipo)
    .reduce((acc, l) => acc + l.valor, 0);
}

/** Soma os lançamentos no intervalo de datas [inicio, fim) — strings 'YYYY-MM-DD'. */
function somaIntervalo(
  lancamentos: LinhaLancamento[],
  inicio: string,
  fim: string,
  tipo: 'receita' | 'despesa',
) {
  return lancamentos
    .filter((l) => l.tipo === tipo && l.data >= inicio && l.data < fim)
    .reduce((acc, l) => acc + l.valor, 0);
}

function parseData(s: string): Date {
  const [a, m, d] = s.split('-').map(Number);
  return new Date(a, (m ?? 1) - 1, d ?? 1);
}

function addDias(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

function formatBr(s: string): string {
  const [a, m, d] = s.split('-');
  return a && m && d ? `${d}/${m}/${a}` : s;
}

type RangeData = {
  inicio: string; // inclusivo
  fim: string; // exclusivo
  prevInicio: string;
  prevFim: string;
  label: string;
  comparacao: string;
};

/** Traduz o filtro (preset ou personalizado) num intervalo de datas + janela anterior. */
function rangeDoFiltro(filtro: FiltroPeriodo, hoje: Date): RangeData {
  const y = hoje.getFullYear();
  const m = hoje.getMonth();

  switch (filtro.periodo) {
    case 'mesPassado': {
      const ini = new Date(y, m - 1, 1);
      return {
        inicio: ymd(ini),
        fim: ymd(new Date(y, m, 1)),
        prevInicio: ymd(new Date(y, m - 2, 1)),
        prevFim: ymd(ini),
        label: `${MESES[ini.getMonth()]} · ${ini.getFullYear()}`,
        comparacao: 'vs. mês anterior',
      };
    }
    case 'trimestre': {
      const ini = new Date(y, m - 2, 1);
      return {
        inicio: ymd(ini),
        fim: ymd(new Date(y, m + 1, 1)),
        prevInicio: ymd(new Date(y, m - 5, 1)),
        prevFim: ymd(ini),
        label: 'Últimos 3 meses',
        comparacao: 'vs. trimestre anterior',
      };
    }
    case 'ano': {
      const ini = new Date(y, 0, 1);
      return {
        inicio: ymd(ini),
        fim: ymd(new Date(y + 1, 0, 1)),
        prevInicio: ymd(new Date(y - 1, 0, 1)),
        prevFim: ymd(ini),
        label: String(y),
        comparacao: 'vs. ano anterior',
      };
    }
    case 'personalizado': {
      // Sem datas válidas ainda → cai no mês atual para não quebrar.
      if (!filtro.inicio || !filtro.fim || filtro.inicio > filtro.fim) {
        return rangeDoFiltro({ periodo: 'mes' }, hoje);
      }
      const ini = parseData(filtro.inicio);
      const fimExcl = addDias(parseData(filtro.fim), 1); // fim inclusivo → exclusivo
      const dias = Math.max(1, Math.round((fimExcl.getTime() - ini.getTime()) / 86400000));
      return {
        inicio: ymd(ini),
        fim: ymd(fimExcl),
        prevInicio: ymd(addDias(ini, -dias)),
        prevFim: ymd(ini),
        label: `${formatBr(filtro.inicio)} – ${formatBr(filtro.fim)}`,
        comparacao: 'vs. período anterior',
      };
    }
    case 'mes':
    default: {
      const ini = new Date(y, m, 1);
      return {
        inicio: ymd(ini),
        fim: ymd(new Date(y, m + 1, 1)),
        prevInicio: ymd(new Date(y, m - 1, 1)),
        prevFim: ymd(ini),
        label: `${MESES[m]} · ${y}`,
        comparacao: 'vs. mês anterior',
      };
    }
  }
}

/** Limites de data [inicio, fim) de um filtro — reutilizável por outros serviços. */
export function limitesDoFiltro(filtro: FiltroPeriodo): { inicio: string; fim: string } {
  const r = rangeDoFiltro(filtro, new Date());
  return { inicio: r.inicio, fim: r.fim };
}

/** Resumo do período escolhido (receita, custos, lucro e variação vs. anterior). */
export async function buscarResumoFinanceiro(
  filtro: FiltroPeriodo = { periodo: 'mes' },
): Promise<ResumoFinanceiro> {
  const range = rangeDoFiltro(filtro, new Date());
  const lancamentos = await buscarLancamentos();

  if (!lancamentos || lancamentos.length === 0) {
    return { ...RESUMO_FALLBACK, mesLabel: range.label, comparacao: range.comparacao };
  }

  const receita = somaIntervalo(lancamentos, range.inicio, range.fim, 'receita');
  const custos = somaIntervalo(lancamentos, range.inicio, range.fim, 'despesa');
  const lucro = receita - custos;

  const lucroAnt =
    somaIntervalo(lancamentos, range.prevInicio, range.prevFim, 'receita') -
    somaIntervalo(lancamentos, range.prevInicio, range.prevFim, 'despesa');

  const variacaoLucro = lucroAnt !== 0 ? ((lucro - lucroAnt) / Math.abs(lucroAnt)) * 100 : null;

  return {
    mesLabel: range.label,
    receita,
    custos,
    lucro,
    variacaoLucro,
    comparacao: range.comparacao,
    exemplo: false,
  };
}

/** Série dos últimos 6 meses (receita x despesa) para o gráfico de evolução. */
export async function buscarEvolucao(): Promise<PontoEvolucao[]> {
  const lancamentos = await buscarLancamentos();
  if (!lancamentos || lancamentos.length === 0) return EVOLUCAO_FALLBACK;

  const hoje = new Date();
  const pontos: PontoEvolucao[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const ano = d.getFullYear();
    const mes = d.getMonth();
    pontos.push({
      mes: MESES[mes],
      receita: somaMes(lancamentos, ano, mes, 'receita'),
      despesa: somaMes(lancamentos, ano, mes, 'despesa'),
    });
  }

  return pontos;
}

function rotuloMesAtual() {
  const hoje = new Date();
  return `${MESES[hoje.getMonth()]} · ${hoje.getFullYear()}`;
}

// 'YYYY-MM-DD' a partir de uma Date (componentes locais, sem fuso UTC).
function ymd(d: Date): string {
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export type ProjecaoCaixaData = {
  /** Saldo (R$) projetado por dia: 31 pontos, de hoje até +30 dias. */
  serie: number[];
  /** Saldo acumulado até hoje. */
  saldoAtual: number;
  /** Saldo projetado no fim dos 30 dias. */
  saldoFinal: number;
  /** Há lançamentos com data futura dentro da janela? */
  temFuturos: boolean;
  /** true quando é exemplo (sem lançamentos no banco). */
  exemplo: boolean;
};

const PROJECAO_FALLBACK: ProjecaoCaixaData = {
  serie: [27800, 29000, 28600, 18000, 15200, 15000, 16100, 15400],
  saldoAtual: 27800,
  saldoFinal: 15400,
  temFuturos: false,
  exemplo: true,
};

/**
 * Projeção de fluxo de caixa para os próximos 30 dias. Parte do saldo
 * acumulado até hoje (todas as receitas − despesas com data <= hoje) e vai
 * somando, dia a dia, os lançamentos com data futura dentro da janela.
 */
export async function buscarProjecaoCaixa(): Promise<ProjecaoCaixaData> {
  const lancamentos = await buscarLancamentos();
  if (!lancamentos || lancamentos.length === 0) return PROJECAO_FALLBACK;

  const hoje = new Date();
  const hojeStr = ymd(hoje);

  const sinal = (l: LinhaLancamento) => (l.tipo === 'receita' ? l.valor : -l.valor);

  // Saldo acumulado até hoje (inclui os lançamentos de hoje).
  let saldo = lancamentos.reduce((acc, l) => (l.data <= hojeStr ? acc + sinal(l) : acc), 0);

  const saldoAtual = saldo;
  const serie: number[] = [saldo];
  let temFuturos = false;

  for (let i = 1; i <= 30; i++) {
    const dia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i);
    const diaStr = ymd(dia);
    const liquidoDoDia = lancamentos.reduce((acc, l) => {
      if (l.data === diaStr) {
        temFuturos = true;
        return acc + sinal(l);
      }
      return acc;
    }, 0);
    saldo += liquidoDoDia;
    serie.push(saldo);
  }

  return { serie, saldoAtual, saldoFinal: saldo, temFuturos, exemplo: false };
}

/**
 * Cria um lançamento para o usuário logado. A RLS exige usuario_id = auth.uid(),
 * então buscamos o id da sessão atual antes de inserir.
 */
export async function criarLancamento(novo: NovoLancamento): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado.');

  const { data: auth } = await supabase.auth.getUser();
  const usuarioId = auth.user?.id;
  if (!usuarioId) throw new Error('Sessão expirada. Entre novamente.');

  const payload: Record<string, unknown> = {
    usuario_id: usuarioId,
    tipo: novo.tipo,
    valor: novo.valor,
    descricao: novo.descricao?.trim() || null,
    categoria: novo.categoria?.trim() || null,
    rateio_modo: novo.rateio?.modo ?? 'geral',
    rateio_metodo: novo.rateio?.metodo ?? null,
  };
  // Só manda a data se o usuário escolheu uma — senão deixa o default do banco.
  if (novo.data) payload.data = novo.data;

  const { data, error } = await supabase.from('lancamento').insert(payload).select('id').single();
  if (error) throw new Error(error.message);

  await inserirRateio(data.id as string, novo.rateio?.alocacoes ?? []);
}

/** Grava as parcelas do rateio (lancamento_talhao) de um lançamento. */
async function inserirRateio(lancamentoId: string, alocacoes: Alocacao[]): Promise<void> {
  if (!supabase || alocacoes.length === 0) return;
  const linhas = alocacoes.map((a) => ({
    lancamento_id: lancamentoId,
    talhao_id: a.talhaoId,
    valor: a.valor,
    percentual: a.percentual,
  }));
  const { error } = await supabase.from('lancamento_talhao').insert(linhas);
  if (error) throw new Error(error.message);
}

/** Carrega as parcelas de rateio de um lançamento (para reabrir a edição). */
export async function buscarAlocacoes(lancamentoId: string): Promise<Alocacao[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('lancamento_talhao')
      .select('talhao_id, valor, percentual')
      .eq('lancamento_id', lancamentoId);
    if (error) throw error;
    return (data ?? []).map((r) => ({
      talhaoId: r.talhao_id,
      valor: Number(r.valor),
      percentual: Number(r.percentual),
    }));
  } catch (erro) {
    console.warn('[financeiro] falha ao buscar rateio:', erro);
    return [];
  }
}

/**
 * Atualiza um lançamento existente. A RLS garante que só o dono altera
 * (a policy lancamento_self vale para UPDATE também).
 */
export async function atualizarLancamento(id: string, dados: NovoLancamento): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado.');

  const payload: Record<string, unknown> = {
    tipo: dados.tipo,
    valor: dados.valor,
    descricao: dados.descricao?.trim() || null,
    categoria: dados.categoria?.trim() || null,
    rateio_modo: dados.rateio?.modo ?? 'geral',
    rateio_metodo: dados.rateio?.metodo ?? null,
  };
  if (dados.data) payload.data = dados.data;

  const { error } = await supabase.from('lancamento').update(payload).eq('id', id);
  if (error) throw new Error(error.message);

  // Refaz o rateio do zero (mais simples e sempre consistente).
  const { error: erroDel } = await supabase.from('lancamento_talhao').delete().eq('lancamento_id', id);
  if (erroDel) throw new Error(erroDel.message);
  await inserirRateio(id, dados.rateio?.alocacoes ?? []);
}

/** Exclui um lançamento. A RLS impede apagar o de outra pessoa. */
export async function excluirLancamento(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase.from('lancamento').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/**
 * Lista os lançamentos do usuário (a RLS já filtra por dono). Quando um período
 * é informado, restringe ao intervalo de datas correspondente — assim o filtro
 * da tela também recorta a lista, não só o resumo.
 */
export async function listarLancamentos(filtro?: FiltroPeriodo, limite = 50): Promise<LancamentoItem[]> {
  if (!supabase) return [];
  try {
    let consulta = supabase
      .from('lancamento')
      .select('id, tipo, descricao, categoria, valor, data, rateio_modo, rateio_metodo')
      .order('data', { ascending: false })
      .order('criado_em', { ascending: false });

    if (filtro) {
      const range = rangeDoFiltro(filtro, new Date());
      consulta = consulta.gte('data', range.inicio).lt('data', range.fim);
    }

    const { data, error } = await consulta.limit(limite);

    if (error) throw error;
    return (data ?? []).map((l) => ({
      id: l.id,
      tipo: l.tipo as TipoLancamento,
      descricao: l.descricao,
      categoria: l.categoria,
      valor: Number(l.valor),
      data: String(l.data),
      rateioModo: (l.rateio_modo ?? null) as ModoRateio | null,
      rateioMetodo: (l.rateio_metodo ?? null) as MetodoDivisao | null,
    }));
  } catch (erro) {
    console.warn('[financeiro] falha ao listar lançamentos:', erro);
    return [];
  }
}
