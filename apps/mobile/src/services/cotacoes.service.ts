/**
 * Serviço de cotações — camada única e trocável entre a UI (RadarCommodities)
 * e as fontes de dados. A UI nunca fala direto com nenhuma API: pede
 * `buscarCotacoes()` e recebe sempre o mesmo formato `Cotacao[]`.
 *
 * Fontes hoje:
 *   - Câmbio USD/BRL  → AwesomeAPI (grátis, tempo quase real)
 *   - Commodities     → tabela `cotacao` no Supabase (ver docs/sql/05_*.sql).
 *                       Se a tabela ainda não existir ou estiver vazia,
 *                       cai no mock abaixo — o radar nunca fica em branco.
 *
 * A tabela `cotacao` será alimentada por uma Edge Function com cron (preços
 * reais). Quando isso existir, NADA muda aqui: o serviço já lê da tabela.
 */

import { supabase } from './supabase';

export type CategoriaCotacao = 'graos' | 'pecuaria' | 'cambio';

export type Cotacao = {
  id: string;
  nome: string;
  /** Ex.: "R$ / saca 60kg", "R$ / arroba", "R$ / USD". */
  unidade: string;
  preco: number;
  /** Variação percentual no dia (positivo = alta). */
  variacao: number;
  categoria: CategoriaCotacao;
  /** Cor do marcador no card. */
  cor: string;
  /** De onde veio o dado — útil para exibir e para depurar. */
  fonte: string;
};

const URL_CAMBIO = 'https://economia.awesomeapi.com.br/json/last/USD-BRL';

// Commodities de reserva, já no formato final de `Cotacao`. Usadas só quando
// a tabela `cotacao` ainda não foi criada/populada — para o radar não ficar vazio.
const COMMODITIES_MOCK: Cotacao[] = [
  { id: 'soja', nome: 'Soja', unidade: 'R$ / saca 60kg', preco: 142.5, variacao: 2.3, categoria: 'graos', cor: '#A3D977', fonte: 'CEPEA (exemplo)' },
  { id: 'milho', nome: 'Milho', unidade: 'R$ / saca 60kg', preco: 78.9, variacao: -0.8, categoria: 'graos', cor: '#FFC107', fonte: 'CEPEA (exemplo)' },
  { id: 'algodao', nome: 'Algodão', unidade: 'R$ / arroba', preco: 158.2, variacao: 1.1, categoria: 'graos', cor: '#E2E8F0', fonte: 'CEPEA (exemplo)' },
  { id: 'boi', nome: 'Boi gordo', unidade: 'R$ / arroba', preco: 240.5, variacao: 0.5, categoria: 'pecuaria', cor: '#C49A6C', fonte: 'CEPEA (exemplo)' },
  { id: 'cafe', nome: 'Café arábica', unidade: 'R$ / saca 60kg', preco: 1845, variacao: 3.7, categoria: 'graos', cor: '#6F4E37', fonte: 'CEPEA (exemplo)' },
];

// Dólar de reserva — usado só se a AwesomeAPI estiver fora do ar, para o
// radar nunca quebrar nem ficar sem a linha de câmbio.
const CAMBIO_FALLBACK: Cotacao = {
  id: 'usd', nome: 'Dólar', unidade: 'R$ / USD', preco: 0, variacao: 0, categoria: 'cambio', cor: '#3B82F6', fonte: 'indisponível',
};

type AwesomeApiResposta = {
  USDBRL?: {
    bid?: string;
    pctChange?: string;
  };
};

/**
 * Busca o câmbio USD/BRL real na AwesomeAPI. Em caso de falha (offline,
 * timeout, formato inesperado), devolve o fallback em vez de lançar erro —
 * o resto do radar não pode cair junto com uma única fonte.
 */
async function buscarCambio(): Promise<Cotacao> {
  try {
    const resposta = await fetch(URL_CAMBIO);
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);

    const json = (await resposta.json()) as AwesomeApiResposta;
    const cotacao = json.USDBRL;
    const preco = Number(cotacao?.bid);
    const variacao = Number(cotacao?.pctChange);

    if (!Number.isFinite(preco) || preco <= 0) throw new Error('Cotação inválida');

    return {
      ...CAMBIO_FALLBACK,
      preco,
      variacao: Number.isFinite(variacao) ? variacao : 0,
      fonte: 'AwesomeAPI',
    };
  } catch (erro) {
    console.warn('[cotacoes] falha ao buscar câmbio USD/BRL:', erro);
    return CAMBIO_FALLBACK;
  }
}

/**
 * Lê as commodities da tabela `cotacao` no Supabase (categoria != 'cambio').
 * Se o Supabase não estiver configurado, a tabela não existir, der erro ou
 * vier vazia, devolve o mock — o radar nunca fica em branco por causa disso.
 */
async function buscarCommodities(): Promise<Cotacao[]> {
  if (!supabase) return COMMODITIES_MOCK;

  try {
    const { data, error } = await supabase
      .from('cotacao')
      .select('id, nome, unidade, preco, variacao, categoria, cor, fonte')
      .neq('categoria', 'cambio')
      .order('nome', { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) return COMMODITIES_MOCK;

    return data.map((linha) => ({
      id: linha.id,
      nome: linha.nome,
      unidade: linha.unidade,
      preco: Number(linha.preco),
      variacao: Number(linha.variacao),
      categoria: linha.categoria as CategoriaCotacao,
      cor: linha.cor,
      fonte: linha.fonte,
    }));
  } catch (erro) {
    console.warn('[cotacoes] falha ao ler tabela cotacao, usando mock:', erro);
    return COMMODITIES_MOCK;
  }
}

/**
 * Ponto de entrada usado pela UI. Junta commodities (Supabase) + câmbio
 * (AwesomeAPI) e devolve a lista pronta para o radar. As duas fontes são
 * buscadas em paralelo; o câmbio fica por último (como na ordem atual).
 */
export async function buscarCotacoes(): Promise<Cotacao[]> {
  const [commodities, cambio] = await Promise.all([buscarCommodities(), buscarCambio()]);
  return [...commodities, cambio];
}
