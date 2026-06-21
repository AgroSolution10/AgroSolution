/**
 * Motor de alertas inteligentes. Coleta "sinais" das fontes do app (mercado e
 * financeiro por enquanto; clima entra depois) e aplica um conjunto de regras
 * determinísticas para gerar recomendações acionáveis.
 *
 * Desenho proposital: hoje as regras são funções; amanhã uma IA recebe os
 * MESMOS `Sinais` e devolve `AlertaGerado[]` em linguagem natural — sem que a
 * tela de Alertas precise mudar. Os alertas são calculados ao vivo (sem
 * back-end/cron); push automático fica para uma fase futura.
 */
import { carregarAlertas } from './alertas.service';
import { buscarPrevisao, type Previsao } from './clima.service';
import { buscarCotacoes } from './cotacoes.service';
import { buscarProjecaoCaixa, buscarResumoFinanceiro, listarLancamentos } from './financeiro.service';

/** Coordenada da fazenda usada para buscar a previsão do tempo. */
export type Coordenada = { latitude: number; longitude: number };

export type SeveridadeAlerta = 'positivo' | 'info' | 'aviso' | 'critico';
export type CategoriaAlerta = 'mercado' | 'financeiro' | 'clima' | 'combinado';

export type AlertaGerado = {
  id: string;
  severidade: SeveridadeAlerta;
  categoria: CategoriaAlerta;
  titulo: string;
  texto: string;
  quando?: string;
};

type SinalMercado = {
  id: string;
  nome: string;
  preco: number;
  variacao: number;
  categoria: string;
};

type SinaisFinanceiro = {
  receita: number;
  custos: number;
  lucro: number;
  variacaoLucro: number | null;
  saldoProjetado: number;
  /** Compra recente de defensivo/veneno (para a regra combinada com chuva). */
  defensivoRecente: { descricao: string; valor: number } | null;
  /** true quando os números financeiros são exemplo (sem dados reais). */
  exemplo: boolean;
};

export type Sinais = {
  mercado: SinalMercado[];
  financeiro: SinaisFinanceiro;
  /** Previsão do tempo, ou null se não há coordenada/clima indisponível. */
  clima: Previsao | null;
};

// Limiar para considerar um movimento de preço "relevante" (em %).
const VARIACAO_RELEVANTE = 2;

// Palavras que indicam compra de defensivo/agroquímico numa despesa.
const TERMOS_DEFENSIVO = /veneno|defensiv|pulveriz|herbicid|fungicid|inseticid|agrot|agroqu[ií]m|glifosato/i;

// Janela (dias) para considerar a compra de defensivo "recente".
const DIAS_DEFENSIVO_RECENTE = 20;

/** Coleta os sinais atuais das fontes (mercado + financeiro + clima), em paralelo. */
export async function coletarSinais(coords?: Coordenada): Promise<Sinais> {
  const [cotacoes, resumo, projecao, lancamentos, clima] = await Promise.all([
    buscarCotacoes(),
    buscarResumoFinanceiro(),
    buscarProjecaoCaixa(),
    listarLancamentos(),
    coords ? buscarPrevisao(coords.latitude, coords.longitude) : Promise.resolve(null),
  ]);

  // Procura uma compra de defensivo nos últimos dias. Usa data LOCAL (não UTC),
  // pois lancamento.data é comparado em 'YYYY-MM-DD' local no resto do app.
  const limite = new Date();
  limite.setDate(limite.getDate() - DIAS_DEFENSIVO_RECENTE);
  const limiteStr = `${limite.getFullYear()}-${String(limite.getMonth() + 1).padStart(2, '0')}-${String(
    limite.getDate(),
  ).padStart(2, '0')}`;
  const compra = lancamentos.find(
    (l) =>
      l.tipo === 'despesa' &&
      l.data >= limiteStr &&
      TERMOS_DEFENSIVO.test(`${l.descricao ?? ''} ${l.categoria ?? ''}`),
  );

  return {
    mercado: cotacoes.map((c) => ({
      id: c.id,
      nome: c.nome,
      preco: c.preco,
      variacao: c.variacao,
      categoria: c.categoria,
    })),
    financeiro: {
      receita: resumo.receita,
      custos: resumo.custos,
      lucro: resumo.lucro,
      variacaoLucro: resumo.variacaoLucro,
      saldoProjetado: projecao.saldoFinal,
      defensivoRecente: compra
        ? { descricao: compra.descricao || 'um defensivo', valor: compra.valor }
        : null,
      exemplo: resumo.exemplo || projecao.exemplo,
    },
    clima,
  };
}

/**
 * Aplica as regras sobre os sinais e devolve os alertas. Função pura: dado o
 * mesmo conjunto de sinais, produz sempre os mesmos alertas (fácil de testar e
 * de, no futuro, substituir/complementar por IA).
 */
export function gerarAlertas(sinais: Sinais): AlertaGerado[] {
  const alertas: AlertaGerado[] = [];

  // ---- Regras de mercado ----
  for (const m of sinais.mercado) {
    if (m.categoria === 'cambio') continue; // dólar não vira alerta de venda
    if (m.variacao >= VARIACAO_RELEVANTE) {
      alertas.push({
        id: `mkt-alta-${m.id}`,
        severidade: 'positivo',
        categoria: 'mercado',
        titulo: `${m.nome} em alta`,
        texto: `Subiu ${m.variacao.toFixed(1)}% hoje (${brl(m.preco)}). Pode ser uma boa janela para vender parte da safra.`,
        quando: 'agora',
      });
    } else if (m.variacao <= -VARIACAO_RELEVANTE) {
      alertas.push({
        id: `mkt-queda-${m.id}`,
        severidade: 'aviso',
        categoria: 'mercado',
        titulo: `${m.nome} em queda`,
        texto: `Caiu ${Math.abs(m.variacao).toFixed(1)}% hoje (${brl(m.preco)}). Pode valer segurar a venda e aguardar uma recuperação.`,
        quando: 'agora',
      });
    }
  }

  // ---- Regras de financeiro (só com dados reais) ----
  const f = sinais.financeiro;
  if (!f.exemplo) {
    if (f.lucro < 0) {
      alertas.push({
        id: 'fin-vermelho',
        severidade: 'critico',
        categoria: 'financeiro',
        titulo: 'Caixa no vermelho',
        texto: `No período, os custos (${brl(f.custos)}) passaram a receita (${brl(f.receita)}). Vale revisar as despesas.`,
      });
    }
    if (f.variacaoLucro !== null && f.variacaoLucro <= -20) {
      alertas.push({
        id: 'fin-lucro-caindo',
        severidade: 'aviso',
        categoria: 'financeiro',
        titulo: 'Lucro em queda',
        texto: `Seu lucro caiu ${Math.abs(f.variacaoLucro).toFixed(0)}% em relação ao período anterior. Acompanhe de perto.`,
      });
    }
    if (f.saldoProjetado < 0) {
      alertas.push({
        id: 'fin-proj-negativa',
        severidade: 'critico',
        categoria: 'financeiro',
        titulo: 'Projeção de caixa negativa',
        texto: `A projeção fica negativa nos próximos 30 dias (${brl(f.saldoProjetado)}). Planeje uma entrada de recursos.`,
      });
    }
  }

  // ---- Regras de clima (e combinada com financeiro) ----
  if (sinais.clima?.choveProximas48h) {
    const mm = sinais.clima.precipitacaoMm;
    if (f.defensivoRecente) {
      // Regra combinada: comprou defensivo + vai chover → não pulverize.
      alertas.push({
        id: 'clima-defensivo',
        severidade: 'critico',
        categoria: 'combinado',
        titulo: 'Não pulverize agora',
        texto: `Você comprou ${f.defensivoRecente.descricao} e há chuva prevista (~${mm} mm) nas próximas 48h, que pode lavar o defensivo e desperdiçar a aplicação. Adie a pulverização.`,
        quando: 'próximas 48h',
      });
    } else {
      alertas.push({
        id: 'clima-chuva',
        severidade: 'aviso',
        categoria: 'clima',
        titulo: 'Chuva a caminho',
        texto: `Previsão de ~${mm} mm de chuva nas próximas 48h. Adie pulverizações e aplicações que precisam de tempo seco.`,
        quando: 'próximas 48h',
      });
    }
  }

  return alertas;
}

/** Conveniência para a UI: coleta os sinais e já devolve os alertas gerados. */
export async function carregarAlertasGerados(coords?: Coordenada): Promise<AlertaGerado[]> {
  try {
    const sinais = await coletarSinais(coords);
    return gerarAlertas(sinais);
  } catch (erro) {
    console.warn('[motor-alertas] falha ao gerar alertas:', erro);
    return [];
  }
}

/**
 * Total de alertas que pedem atenção (para o badge da Sidebar): os gerados pelo
 * motor + os alvos de preço que já foram atingidos.
 */
export async function contarAlertas(coords?: Coordenada): Promise<number> {
  try {
    const [gerados, precos] = await Promise.all([carregarAlertasGerados(coords), carregarAlertas()]);
    const atingidos = precos.filter((p) => p.atingido).length;
    return gerados.length + atingidos;
  } catch (erro) {
    console.warn('[motor-alertas] falha ao contar alertas:', erro);
    return 0;
  }
}

function brl(valor: number) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
