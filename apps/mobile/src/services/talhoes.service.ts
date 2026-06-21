/**
 * Serviço de talhões — áreas produtivas da fazenda. Cada talhão tem nome,
 * cultura, área (ha) e um ponto no mapa. Pertence a uma fazenda; a RLS
 * (ver docs/sql/09_talhao.sql) garante que só membros da fazenda acessam.
 */
import { supabase } from './supabase';

export type Talhao = {
  id: string;
  nome: string;
  cultura: string | null;
  areaHa: number | null;
  latitude: number | null;
  longitude: number | null;
};

export type NovoTalhao = {
  nome: string;
  cultura?: string | null;
  areaHa?: number | null;
  latitude?: number | null;
  longitude?: number | null;
};

/** Lista os talhões de uma fazenda (a RLS também filtra por vínculo). */
export async function listarTalhoes(fazendaId: string): Promise<Talhao[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('talhao')
      .select('id, nome, cultura, area_ha, latitude, longitude')
      .eq('fazenda_id', fazendaId)
      .order('criado_em', { ascending: false });

    if (error) throw error;
    return (data ?? []).map((t) => ({
      id: t.id,
      nome: t.nome,
      cultura: t.cultura,
      areaHa: t.area_ha != null ? Number(t.area_ha) : null,
      latitude: t.latitude != null ? Number(t.latitude) : null,
      longitude: t.longitude != null ? Number(t.longitude) : null,
    }));
  } catch (erro) {
    console.warn('[talhoes] falha ao listar talhões:', erro);
    return [];
  }
}

/** Cria um talhão na fazenda informada. */
export async function criarTalhao(fazendaId: string, novo: NovoTalhao): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado.');

  const { error } = await supabase.from('talhao').insert({
    fazenda_id: fazendaId,
    nome: novo.nome.trim(),
    cultura: novo.cultura?.trim() || null,
    area_ha: novo.areaHa ?? null,
    latitude: novo.latitude ?? null,
    longitude: novo.longitude ?? null,
  });
  if (error) throw new Error(error.message);
}

/** Exclui um talhão. A RLS impede apagar de outra fazenda. */
export async function excluirTalhao(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado.');
  const { error } = await supabase.from('talhao').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
