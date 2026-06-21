import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { FiltrosPeriodo, type FiltroPeriodo } from '@/components/FiltrosPeriodo';
import { PageScaffold } from '@/screens/dashboard/components/PageScaffold';
import {
  buscarResumoFinanceiro,
  listarLancamentos,
  type LancamentoItem,
  type ResumoFinanceiro,
} from '@/services/financeiro.service';
import {
  buscarResultadosTalhoes,
  listarTalhoes,
  type ResultadoTalhao,
  type Talhao,
} from '@/services/talhoes.service';
import { baixarCsv, imprimirRelatorio } from '@/utils/exportar';
import { colors, radius, shadows } from '@/theme/colors';
import { Usuario } from '@/screens/auth/cadastro/types';

type RelatoriosScreenProps = {
  desktop: boolean;
  usuario: Usuario;
};

const ROTULO_CULTURA: Record<string, string> = {
  soja: 'Soja',
  milho: 'Milho',
  algodao: 'Algodão',
  pecuaria: 'Pecuária',
};

export function RelatoriosScreen({ desktop, usuario }: RelatoriosScreenProps) {
  const fazendaId = usuario.fazendaId;
  const [filtro, setFiltro] = useState<FiltroPeriodo>({ periodo: 'mes' });
  const [resumo, setResumo] = useState<ResumoFinanceiro | null>(null);
  const [lancamentos, setLancamentos] = useState<LancamentoItem[]>([]);
  const [talhoes, setTalhoes] = useState<Talhao[]>([]);
  const [resultados, setResultados] = useState<Record<string, ResultadoTalhao>>({});
  const [carregando, setCarregando] = useState(true);

  const chaveFiltro = `${filtro.periodo}:${filtro.inicio ?? ''}:${filtro.fim ?? ''}`;

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    Promise.all([
      buscarResumoFinanceiro(filtro),
      listarLancamentos(filtro),
      fazendaId ? listarTalhoes(fazendaId) : Promise.resolve([]),
      buscarResultadosTalhoes(filtro),
    ]).then(([r, l, t, res]) => {
      if (!ativo) return;
      setResumo(r);
      setLancamentos(l);
      setTalhoes(t);
      setResultados(res);
      setCarregando(false);
    });
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveFiltro, fazendaId]);

  // Só talhões que tiveram movimento no período.
  const talhoesComResultado = useMemo(
    () => talhoes.filter((t) => resultados[t.id] && (resultados[t.id].receita > 0 || resultados[t.id].custo > 0)),
    [talhoes, resultados],
  );

  function exportarCsv() {
    const linhas = lancamentos.map((l) => [
      formatData(l.data),
      l.tipo === 'receita' ? 'Receita' : 'Despesa',
      l.categoria ?? '',
      l.descricao ?? '',
      l.valor,
    ]);
    baixarCsv(`relatorio-${chaveFiltro}.csv`, ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor (R$)'], linhas);
  }

  function exportarPdf() {
    imprimirRelatorio(`Relatório AgroSolution · ${resumo?.mesLabel ?? ''}`, montarHtml());
  }

  function montarHtml(): string {
    const r = resumo;
    const cards = r
      ? `<div class="cards">
          <div class="card"><div class="v">${brl(r.receita)}</div><div class="l">Receita</div></div>
          <div class="card"><div class="v">${brl(r.custos)}</div><div class="l">Custos</div></div>
          <div class="card"><div class="v ${r.lucro >= 0 ? 'pos' : 'neg'}">${brl(r.lucro)}</div><div class="l">Lucro</div></div>
        </div>`
      : '';

    const linhasTalhoes = talhoesComResultado
      .map((t) => {
        const res = resultados[t.id];
        return `<tr><td>${esc(t.nome)}</td><td class="num">${brl(res.receita)}</td><td class="num">${brl(
          res.custo,
        )}</td><td class="num ${res.resultado >= 0 ? 'pos' : 'neg'}">${brl(res.resultado)}</td></tr>`;
      })
      .join('');
    const tabelaTalhoes = linhasTalhoes
      ? `<h2>Resultado por talhão</h2><table><thead><tr><th>Talhão</th><th class="num">Receita</th><th class="num">Custo</th><th class="num">Resultado</th></tr></thead><tbody>${linhasTalhoes}</tbody></table>`
      : '';

    const linhasLanc = lancamentos
      .map(
        (l) =>
          `<tr><td>${formatData(l.data)}</td><td>${l.tipo === 'receita' ? 'Receita' : 'Despesa'}</td><td>${esc(
            l.descricao ?? '',
          )}</td><td class="num">${brl(l.valor)}</td></tr>`,
      )
      .join('');
    const tabelaLanc = linhasLanc
      ? `<h2>Lançamentos</h2><table><thead><tr><th>Data</th><th>Tipo</th><th>Descrição</th><th class="num">Valor</th></tr></thead><tbody>${linhasLanc}</tbody></table>`
      : '<h2>Lançamentos</h2><p class="sub">Sem lançamentos no período.</p>';

    return `<h1>Relatório financeiro</h1><p class="sub">${esc(usuario.nome)} · ${esc(
      r?.mesLabel ?? '',
    )}</p>${cards}${tabelaTalhoes}${tabelaLanc}`;
  }

  return (
    <PageScaffold
      desktop={desktop}
      titulo="Relatórios"
      subtitulo="Resumo financeiro e por talhão do período, pronto para exportar."
      headerRight={
        <View style={styles.exportar}>
          <Pressable onPress={exportarPdf} style={({ pressed }) => [styles.btn, styles.btnPrim, pressed && styles.btnPressed]}>
            <Feather name="printer" size={16} color={colors.surface} />
            <Text style={styles.btnPrimText}>PDF</Text>
          </Pressable>
          <Pressable onPress={exportarCsv} style={({ pressed }) => [styles.btn, styles.btnSec, pressed && styles.btnPressed]}>
            <Feather name="download" size={16} color={colors.primary} />
            <Text style={styles.btnSecText}>CSV</Text>
          </Pressable>
        </View>
      }
    >
      <FiltrosPeriodo valor={filtro} onChange={setFiltro} />

      {carregando ? (
        <View style={[styles.card, styles.estado]}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <>
          {resumo ? (
            <View style={styles.resumo}>
              <Indicador valor={brl(resumo.receita)} rotulo="Receita" cor={colors.success} />
              <Indicador valor={brl(resumo.custos)} rotulo="Custos" cor={colors.danger} />
              <Indicador
                valor={brl(resumo.lucro)}
                rotulo="Lucro"
                cor={resumo.lucro >= 0 ? colors.success : colors.danger}
              />
            </View>
          ) : null}

          {talhoesComResultado.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardTitulo}>Resultado por talhão</Text>
              <View style={styles.tabelaHead}>
                <Text style={[styles.th, styles.thNome]}>Talhão</Text>
                <Text style={[styles.th, styles.thNum]}>Receita</Text>
                <Text style={[styles.th, styles.thNum]}>Custo</Text>
                <Text style={[styles.th, styles.thNum]}>Result.</Text>
              </View>
              {talhoesComResultado.map((t) => {
                const res = resultados[t.id];
                return (
                  <View key={t.id} style={styles.tr}>
                    <View style={styles.thNome}>
                      <Text style={styles.tdNome} numberOfLines={1}>{t.nome}</Text>
                      {t.cultura ? (
                        <Text style={styles.tdCultura}>{ROTULO_CULTURA[t.cultura] ?? t.cultura}</Text>
                      ) : null}
                    </View>
                    <Text style={[styles.td, styles.thNum]}>{brlCurto(res.receita)}</Text>
                    <Text style={[styles.td, styles.thNum]}>{brlCurto(res.custo)}</Text>
                    <Text
                      style={[styles.td, styles.thNum, { color: res.resultado >= 0 ? colors.success : colors.danger, fontWeight: '800' }]}
                    >
                      {brlCurto(res.resultado)}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.cardTitulo}>Lançamentos do período ({lancamentos.length})</Text>
            {lancamentos.length === 0 ? (
              <Text style={styles.vazio}>Nenhum lançamento no período.</Text>
            ) : (
              lancamentos.map((l) => (
                <View key={l.id} style={styles.tr}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tdNome} numberOfLines={1}>
                      {l.descricao || (l.tipo === 'receita' ? 'Receita' : 'Despesa')}
                    </Text>
                    <Text style={styles.tdCultura}>{formatData(l.data)}</Text>
                  </View>
                  <Text
                    style={[styles.td, { color: l.tipo === 'receita' ? colors.success : colors.danger, fontWeight: '800' }]}
                  >
                    {l.tipo === 'receita' ? '+' : '−'} {brlCurto(l.valor)}
                  </Text>
                </View>
              ))
            )}
          </View>
        </>
      )}
    </PageScaffold>
  );
}

function Indicador({ valor, rotulo, cor }: { valor: string; rotulo: string; cor: string }) {
  return (
    <View style={styles.indicador}>
      <Text style={[styles.indicadorValor, { color: cor }]}>{valor}</Text>
      <Text style={styles.indicadorRotulo}>{rotulo}</Text>
    </View>
  );
}

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function brlCurto(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function formatData(iso: string) {
  const [a, m, d] = iso.split('-');
  return a && m && d ? `${d}/${m}/${a}` : iso;
}
function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

const styles = StyleSheet.create({
  exportar: { flexDirection: 'row', gap: 8 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.sm },
  btnPrim: { backgroundColor: colors.primary },
  btnSec: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  btnPressed: { opacity: 0.85 },
  btnPrimText: { color: colors.surface, fontWeight: '700', fontSize: 14 },
  btnSecText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  resumo: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  indicador: {
    flexGrow: 1,
    flexBasis: 150,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 20,
    gap: 2,
    ...shadows.card,
  },
  indicadorValor: { fontSize: 22, fontWeight: '800' },
  indicadorRotulo: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 24, gap: 4, ...shadows.card },
  cardTitulo: { color: colors.text, fontSize: 17, fontWeight: '700', marginBottom: 8 },
  estado: { minHeight: 120, alignItems: 'center', justifyContent: 'center' },
  vazio: { color: colors.textMuted, fontSize: 14, paddingVertical: 8 },
  tabelaHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  th: { color: colors.textSoft, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  thNome: { flex: 1 },
  thNum: { width: 84, textAlign: 'right' },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    gap: 6,
  },
  td: { color: colors.text, fontSize: 13 },
  tdNome: { color: colors.text, fontSize: 14, fontWeight: '600' },
  tdCultura: { color: colors.textSoft, fontSize: 12 },
});
