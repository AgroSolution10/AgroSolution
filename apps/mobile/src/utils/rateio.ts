/**
 * Cálculo do rateio de um lançamento entre talhões.
 *
 * Regra de ouro: a soma das parcelas SEMPRE é igual ao total (sem perder nem
 * sobrar centavo). Para isso, trabalhamos em centavos e a última parcela
 * absorve o arredondamento.
 */

export type ModoRateio = 'geral' | 'especifico' | 'todos' | 'personalizado';
export type MetodoDivisao = 'igual' | 'area';

export type TalhaoRateio = { id: string; areaHa: number | null };

export type Alocacao = { talhaoId: string; valor: number; percentual: number };

/**
 * Distribui `total` entre os `pesos` (relativos), em centavos, garantindo que a
 * soma das partes seja exatamente `total`. A última parte recebe a sobra.
 */
function distribuir(total: number, pesos: number[]): number[] {
  const n = pesos.length;
  if (n === 0) return [];

  const somaPesos = pesos.reduce((a, b) => a + b, 0);
  // Sem pesos válidos (ex.: todas as áreas zeradas) → divide igualmente.
  const usar = somaPesos > 0 ? pesos : pesos.map(() => 1);
  const soma = somaPesos > 0 ? somaPesos : n;

  const totalCent = Math.round(total * 100);
  let acumulado = 0;

  return usar.map((peso, i) => {
    if (i === n - 1) return (totalCent - acumulado) / 100; // sobra na última
    const cent = Math.round((totalCent * peso) / soma);
    acumulado += cent;
    return cent / 100;
  });
}

function comPercentual(total: number, valores: { talhaoId: string; valor: number }[]): Alocacao[] {
  return valores.map((v) => ({
    talhaoId: v.talhaoId,
    valor: v.valor,
    percentual: total > 0 ? Math.round((v.valor / total) * 10000) / 100 : 0,
  }));
}

type CalcularRateioParams = {
  total: number;
  modo: ModoRateio;
  /** Só para modo 'todos'. */
  metodo?: MetodoDivisao;
  /** Só para modo 'especifico'. */
  talhaoId?: string | null;
  /** Só para modo 'personalizado': talhaoId → percentual (0-100). */
  percentuais?: Record<string, number>;
  talhoes: TalhaoRateio[];
};

/**
 * Devolve as parcelas (talhaoId, valor, percentual) conforme o modo escolhido.
 * Retorna [] para 'geral' (lançamento não atribuído a talhões).
 */
export function calcularRateio(p: CalcularRateioParams): Alocacao[] {
  const { total, modo, metodo = 'igual', talhaoId, percentuais = {}, talhoes } = p;

  if (modo === 'geral' || total <= 0 || talhoes.length === 0) return [];

  if (modo === 'especifico') {
    if (!talhaoId) return [];
    return [{ talhaoId, valor: round2(total), percentual: 100 }];
  }

  if (modo === 'todos') {
    const pesos =
      metodo === 'area' ? talhoes.map((t) => (t.areaHa && t.areaHa > 0 ? t.areaHa : 0)) : talhoes.map(() => 1);
    const valores = distribuir(total, pesos);
    return comPercentual(
      total,
      talhoes.map((t, i) => ({ talhaoId: t.id, valor: valores[i] })),
    );
  }

  // personalizado: usa os percentuais informados como pesos.
  const usados = talhoes.filter((t) => (percentuais[t.id] ?? 0) > 0);
  if (usados.length === 0) return [];
  const pesos = usados.map((t) => percentuais[t.id]);
  const valores = distribuir(total, pesos);
  return usados.map((t, i) => ({
    talhaoId: t.id,
    valor: valores[i],
    percentual: percentuais[t.id],
  }));
}

/** Soma dos percentuais informados (para validar o modo personalizado). */
export function somaPercentuais(percentuais: Record<string, number>): number {
  return Object.values(percentuais).reduce((a, b) => a + (Number(b) || 0), 0);
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
