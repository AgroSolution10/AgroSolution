/**
 * Serviço de clima — previsão do tempo da fazenda via Open-Meteo (grátis, sem
 * chave de API). Usado pelo motor de alertas para regras como "vai chover →
 * adie a pulverização".
 *
 * Devolve um resumo simples das próximas 48h. Em caso de falha (offline, sem
 * coordenada, formato inesperado), devolve null — quem chama apenas deixa de
 * gerar alertas de clima, sem quebrar o resto.
 */

export type Previsao = {
  /** true quando há chuva relevante prevista nas próximas 48h. */
  choveProximas48h: boolean;
  /** Soma da precipitação (mm) prevista nas próximas 48h. */
  precipitacaoMm: number;
  /** Maior probabilidade de chuva (%) no período. */
  probMaxChuva: number;
};

// Limiares para considerar que "vai chover" de forma relevante.
const MM_RELEVANTE = 1; // mm acumulados em 48h
const PROB_RELEVANTE = 60; // % de probabilidade

type OpenMeteoResposta = {
  hourly?: {
    time?: string[];
    precipitation?: number[];
    precipitation_probability?: number[];
  };
};

export async function buscarPrevisao(latitude: number, longitude: number): Promise<Previsao | null> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    `&hourly=precipitation,precipitation_probability&forecast_days=3&timezone=auto`;

  try {
    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);

    const json = (await resposta.json()) as OpenMeteoResposta;
    const times = json.hourly?.time ?? [];
    const precip = json.hourly?.precipitation ?? [];
    const prob = json.hourly?.precipitation_probability ?? [];

    // O Open-Meteo devolve o array horário começando às 00:00 de HOJE (local),
    // não "agora". Achamos o índice da hora atual antes de pegar as próximas 48h.
    const agora = Date.now();
    let inicio = times.findIndex((t) => new Date(t).getTime() >= agora);
    if (inicio < 0) inicio = 0;
    const fim = inicio + 48;

    const precipitacaoMm = precip.slice(inicio, fim).reduce((acc, v) => acc + (Number(v) || 0), 0);
    const probMaxChuva = prob.slice(inicio, fim).reduce((max, v) => Math.max(max, Number(v) || 0), 0);

    return {
      choveProximas48h: precipitacaoMm >= MM_RELEVANTE || probMaxChuva >= PROB_RELEVANTE,
      precipitacaoMm: Math.round(precipitacaoMm * 10) / 10,
      probMaxChuva: Math.round(probMaxChuva),
    };
  } catch (erro) {
    console.warn('[clima] falha ao buscar previsão:', erro);
    return null;
  }
}
