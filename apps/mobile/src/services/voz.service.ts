/**
 * Interpretação de comandos de voz (ou texto). Recebe a frase do produtor,
 * identifica a intenção por palavras-chave e responde com DADOS REAIS do app
 * (cotações, financeiro, clima, alertas). Tudo local — sem IA/back-end.
 */
import { buscarPrevisao } from './clima.service';
import { buscarCotacoes } from './cotacoes.service';
import { buscarResumoFinanceiro } from './financeiro.service';
import { carregarAlertasGerados, type Coordenada, type SeveridadeAlerta } from './motor-alertas.service';
import { listarTalhoes } from './talhoes.service';

export type ContextoVoz = {
  coords?: Coordenada;
  fazendaId?: string;
};

const COMMODITIES: { termos: string[]; id: string }[] = [
  { termos: ['soja'], id: 'soja' },
  { termos: ['milho'], id: 'milho' },
  { termos: ['boi', 'gado', 'arroba'], id: 'boi' },
  { termos: ['cafe', 'café'], id: 'cafe' },
  { termos: ['algodao', 'algodão'], id: 'algodao' },
  { termos: ['dolar', 'dólar', 'cambio', 'câmbio'], id: 'usd' },
];

const PESO_SEVERIDADE: Record<SeveridadeAlerta, number> = {
  critico: 3,
  aviso: 2,
  positivo: 1,
  info: 0,
};

/** Interpreta a frase e devolve a resposta (texto) com dados reais. */
export async function interpretarComando(frase: string, ctx: ContextoVoz): Promise<string> {
  const t = normalizar(frase);

  // 1. Cotação de uma commodity (ex.: "preço da soja", "como está o dólar")
  const commodity = COMMODITIES.find((c) => c.termos.some((termo) => t.includes(normalizar(termo))));
  if (commodity) {
    return await responderCotacao(commodity.id);
  }

  // 2. Financeiro (lucro / resumo / caixa)
  if (/(lucro|financeiro|resumo|caixa|ganho|fatur|receita|custo)/.test(t)) {
    return await responderFinanceiro();
  }

  // 3. Clima / chuva
  if (/(chuva|chover|clima|tempo|previsao|previsão|pulveriz)/.test(t)) {
    return await responderClima(ctx.coords);
  }

  // 4. Alertas
  if (/(alerta|aviso|recomenda|devo)/.test(t)) {
    return await responderAlertas(ctx.coords);
  }

  // 5. Talhões
  if (/(talhao|talhão|talhoes|talhões|area|área)/.test(t) && ctx.fazendaId) {
    return await responderTalhoes(ctx.fazendaId);
  }

  // 6. Ajuda / saudação
  if (/(ola|olá|oi|ajuda|pode fazer|comando|consegue|o que voce)/.test(t)) {
    return ajuda();
  }

  return `Não entendi. ${ajuda()}`;
}

/** Sugestões mostradas na tela (também servem como "simulação" sem microfone). */
export const EXEMPLOS_COMANDOS = [
  'Qual o preço da soja?',
  'Como está o dólar?',
  'Qual o meu lucro do mês?',
  'Vai chover na fazenda?',
  'Tenho algum alerta?',
];

// ---- respostas por intenção ----

async function responderCotacao(id: string): Promise<string> {
  const cotacoes = await buscarCotacoes();
  const c = cotacoes.find((x) => x.id === id);
  if (!c) return 'Não encontrei essa cotação agora.';
  const dir = c.variacao >= 0 ? `em alta de ${c.variacao.toFixed(1)}%` : `em queda de ${Math.abs(c.variacao).toFixed(1)}%`;
  return `A ${c.nome} está a ${brl(c.preco)} (${c.unidade}), ${dir} hoje.`;
}

async function responderFinanceiro(): Promise<string> {
  const r = await buscarResumoFinanceiro();
  const base = `Seu lucro em ${r.mesLabel} é ${brl(r.lucro)} — receita de ${brl(r.receita)} e custos de ${brl(r.custos)}.`;
  return r.exemplo ? `${base} (são dados de exemplo até você lançar movimentações)` : base;
}

async function responderClima(coords?: Coordenada): Promise<string> {
  if (!coords) return 'Para a previsão, defina a localização da fazenda em Configurações.';
  const p = await buscarPrevisao(coords.latitude, coords.longitude);
  if (!p) return 'Não consegui consultar a previsão agora.';
  if (p.choveProximas48h) {
    return `Sim, há previsão de cerca de ${p.precipitacaoMm} mm de chuva nas próximas 48 horas. Evite pulverizar.`;
  }
  return 'Sem chuva relevante prevista nas próximas 48 horas. Bom tempo para aplicações.';
}

async function responderAlertas(coords?: Coordenada): Promise<string> {
  const alertas = await carregarAlertasGerados(coords);
  if (alertas.length === 0) return 'Nenhum alerta no momento. Está tudo sob controle.';
  const principal = [...alertas].sort((a, b) => PESO_SEVERIDADE[b.severidade] - PESO_SEVERIDADE[a.severidade])[0];
  const plural = alertas.length === 1 ? 'alerta' : 'alertas';
  return `Você tem ${alertas.length} ${plural}. O mais importante: ${principal.titulo}. ${principal.texto}`;
}

async function responderTalhoes(fazendaId: string): Promise<string> {
  const talhoes = await listarTalhoes(fazendaId);
  if (talhoes.length === 0) return 'Você ainda não tem talhões cadastrados.';
  const plural = talhoes.length === 1 ? 'talhão cadastrado' : 'talhões cadastrados';
  return `Você tem ${talhoes.length} ${plural}.`;
}

function ajuda(): string {
  return 'Posso responder sobre cotações (ex.: "preço da soja"), financeiro ("qual meu lucro"), clima ("vai chover?") e alertas ("tenho algum alerta?").';
}

// ---- utils ----

const DIACRITICOS = new RegExp('[\\u0300-\\u036f]', 'g');

function normalizar(s: string): string {
  return (s ?? '').toLowerCase().normalize('NFD').replace(DIACRITICOS, '');
}

function brl(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
