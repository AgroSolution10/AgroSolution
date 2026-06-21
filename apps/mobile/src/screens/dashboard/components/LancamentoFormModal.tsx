import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import {
  atualizarLancamento,
  buscarAlocacoes,
  criarLancamento,
  type LancamentoItem,
  type RateioInput,
  type TipoLancamento,
} from '@/services/financeiro.service';
import { listarTalhoes, type Talhao } from '@/services/talhoes.service';
import { formatMoeda, maskMoeda, parseMoeda } from '@/utils/masks';
import {
  calcularRateio,
  somaPercentuais,
  type MetodoDivisao,
  type ModoRateio,
} from '@/utils/rateio';
import { colors, radius, shadows } from '@/theme/colors';

type LancamentoFormModalProps = {
  lancamento?: LancamentoItem | null;
  /** Id da fazenda — habilita o rateio por talhão. */
  fazendaId?: string;
  onFechar: () => void;
  onSalvo: () => void;
};

export function LancamentoFormModal({ lancamento, fazendaId, onFechar, onSalvo }: LancamentoFormModalProps) {
  const editando = Boolean(lancamento);

  const [tipo, setTipo] = useState<TipoLancamento>(lancamento?.tipo ?? 'receita');
  const [valor, setValor] = useState(lancamento ? formatMoeda(lancamento.valor) : '');
  const [descricao, setDescricao] = useState(lancamento?.descricao ?? '');
  const [data, setData] = useState(lancamento?.data ?? hojeIso());
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Rateio por talhão
  const [talhoes, setTalhoes] = useState<Talhao[] | null>(fazendaId ? null : []);
  const [modo, setModo] = useState<ModoRateio>(lancamento?.rateioModo ?? 'geral');
  const [metodo, setMetodo] = useState<MetodoDivisao>(lancamento?.rateioMetodo ?? 'igual');
  const [talhaoEspecifico, setTalhaoEspecifico] = useState<string | null>(null);
  const [percentuais, setPercentuais] = useState<Record<string, string>>({});

  // Carrega talhões + (se edição) o rateio salvo.
  useEffect(() => {
    let ativo = true;
    if (!fazendaId) return;
    listarTalhoes(fazendaId).then((ts) => {
      if (ativo) setTalhoes(ts);
    });
    if (lancamento) {
      buscarAlocacoes(lancamento.id).then((alocs) => {
        if (!ativo) return;
        if (lancamento.rateioModo === 'especifico') {
          setTalhaoEspecifico(alocs[0]?.talhaoId ?? null);
        } else if (lancamento.rateioModo === 'personalizado') {
          const p: Record<string, string> = {};
          alocs.forEach((a) => {
            p[a.talhaoId] = String(a.percentual).replace('.', ',');
          });
          setPercentuais(p);
        }
      });
    }
    return () => {
      ativo = false;
    };
  }, [fazendaId, lancamento]);

  const valorNum = parseMoeda(valor);
  const pctNumericos = useMemo(() => {
    const r: Record<string, number> = {};
    for (const [k, v] of Object.entries(percentuais)) r[k] = parseFloat(v.replace(',', '.')) || 0;
    return r;
  }, [percentuais]);

  // Prévia das parcelas (sempre coerente com o que será salvo).
  const alocacoes = useMemo(
    () =>
      calcularRateio({
        total: Number.isFinite(valorNum) ? valorNum : 0,
        modo,
        metodo,
        talhaoId: talhaoEspecifico,
        percentuais: pctNumericos,
        talhoes: (talhoes ?? []).map((t) => ({ id: t.id, areaHa: t.areaHa })),
      }),
    [valorNum, modo, metodo, talhaoEspecifico, pctNumericos, talhoes],
  );

  const somaPct = somaPercentuais(pctNumericos);
  const nomePorId = useMemo(
    () => Object.fromEntries((talhoes ?? []).map((t) => [t.id, t.nome])),
    [talhoes],
  );

  async function salvar() {
    setErro(null);

    if (!Number.isFinite(valorNum) || valorNum <= 0) {
      setErro('Informe um valor válido maior que zero.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      setErro('A data precisa estar no formato AAAA-MM-DD.');
      return;
    }
    if (modo !== 'geral') {
      if ((talhoes ?? []).length === 0) {
        setErro('Cadastre talhões antes de ratear, ou use o modo Geral.');
        return;
      }
      if (modo === 'especifico' && !talhaoEspecifico) {
        setErro('Escolha o talhão.');
        return;
      }
      if (modo === 'personalizado' && Math.abs(somaPct - 100) > 0.5) {
        setErro(`Os percentuais devem somar 100% (estão em ${somaPct.toFixed(0)}%).`);
        return;
      }
    }

    const rateio: RateioInput | undefined =
      modo === 'geral'
        ? undefined
        : { modo, metodo: modo === 'todos' ? metodo : undefined, alocacoes };

    const dados = {
      tipo,
      valor: valorNum,
      descricao,
      categoria: tipo === 'receita' ? 'venda' : 'custo',
      data,
      rateio,
    };

    setSalvando(true);
    try {
      if (lancamento) await atualizarLancamento(lancamento.id, dados);
      else await criarLancamento(dados);
      onSalvo();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar.');
      setSalvando(false);
    }
  }

  return (
    <>
      <Pressable style={styles.backdrop} onPress={salvando ? undefined : onFechar} />
      <View style={styles.centro} pointerEvents="box-none">
        <View style={styles.card}>
          <ScrollView contentContainerStyle={styles.cardConteudo} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Text style={styles.titulo}>{editando ? 'Editar lançamento' : 'Novo lançamento'}</Text>
              <Pressable onPress={onFechar} hitSlop={10} accessibilityLabel="Fechar">
                <Text style={styles.fechar}>×</Text>
              </Pressable>
            </View>

            <View style={styles.tipoSwitch}>
              <TipoBotao label="Receita" ativo={tipo === 'receita'} corAtiva={colors.success} onPress={() => setTipo('receita')} />
              <TipoBotao label="Despesa" ativo={tipo === 'despesa'} corAtiva={colors.danger} onPress={() => setTipo('despesa')} />
            </View>

            <Input label="Valor (R$)" value={valor} onChangeText={(t) => setValor(maskMoeda(t))} keyboardType="numeric" placeholder="0,00" />
            <Input
              label="Descrição (opcional)"
              value={descricao}
              onChangeText={setDescricao}
              placeholder={tipo === 'receita' ? 'Ex.: Venda de soja' : 'Ex.: Compra de fertilizante'}
            />
            <Input label="Data" value={data} onChangeText={setData} placeholder="AAAA-MM-DD" autoCapitalize="none" />

            {fazendaId ? (
              <RateioSection
                talhoes={talhoes}
                modo={modo}
                metodo={metodo}
                talhaoEspecifico={talhaoEspecifico}
                percentuais={percentuais}
                somaPct={somaPct}
                alocacoes={alocacoes}
                nomePorId={nomePorId}
                onModo={setModo}
                onMetodo={setMetodo}
                onEspecifico={setTalhaoEspecifico}
                onPercentual={(id, v) => setPercentuais((p) => ({ ...p, [id]: v }))}
              />
            ) : null}

            {erro ? <Text style={styles.erro}>{erro}</Text> : null}

            <View style={styles.acoes}>
              <Button title="Cancelar" variant="secondary" onPress={onFechar} style={styles.acaoBtn} />
              <Button title={editando ? 'Salvar alterações' : 'Salvar'} onPress={salvar} loading={salvando} style={styles.acaoBtn} />
            </View>
          </ScrollView>
        </View>
      </View>
    </>
  );
}

type RateioSectionProps = {
  talhoes: Talhao[] | null;
  modo: ModoRateio;
  metodo: MetodoDivisao;
  talhaoEspecifico: string | null;
  percentuais: Record<string, string>;
  somaPct: number;
  alocacoes: { talhaoId: string; valor: number; percentual: number }[];
  nomePorId: Record<string, string>;
  onModo: (m: ModoRateio) => void;
  onMetodo: (m: MetodoDivisao) => void;
  onEspecifico: (id: string) => void;
  onPercentual: (id: string, v: string) => void;
};

const MODOS: { id: ModoRateio; label: string }[] = [
  { id: 'geral', label: 'Geral' },
  { id: 'especifico', label: 'Um talhão' },
  { id: 'todos', label: 'Todos' },
  { id: 'personalizado', label: 'Personalizado' },
];

function RateioSection(p: RateioSectionProps) {
  if (p.talhoes === null) {
    return (
      <View style={styles.bloco}>
        <Text style={styles.label}>Rateio por talhão</Text>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const semTalhoes = p.talhoes.length === 0;

  return (
    <View style={styles.bloco}>
      <Text style={styles.label}>Rateio por talhão</Text>

      {semTalhoes ? (
        <Text style={styles.dica}>Você ainda não tem talhões. O lançamento fica como Geral (da fazenda).</Text>
      ) : (
        <>
          <View style={styles.modos}>
            {MODOS.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => p.onModo(m.id)}
                style={[styles.modoPill, p.modo === m.id && styles.modoPillAtivo]}
              >
                <Text style={[styles.modoText, p.modo === m.id && styles.modoTextAtivo]}>{m.label}</Text>
              </Pressable>
            ))}
          </View>

          {p.modo === 'especifico' && (
            <View style={styles.talhaoPills}>
              {p.talhoes.map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => p.onEspecifico(t.id)}
                  style={[styles.talhaoPill, p.talhaoEspecifico === t.id && styles.talhaoPillAtivo]}
                >
                  <Text style={[styles.talhaoText, p.talhaoEspecifico === t.id && styles.talhaoTextAtivo]}>
                    {t.nome}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {p.modo === 'todos' && (
            <View style={styles.metodoSwitch}>
              <Pressable
                onPress={() => p.onMetodo('igual')}
                style={[styles.metodoBtn, p.metodo === 'igual' && styles.metodoBtnAtivo]}
              >
                <Text style={[styles.metodoText, p.metodo === 'igual' && styles.metodoTextAtivo]}>Igual</Text>
              </Pressable>
              <Pressable
                onPress={() => p.onMetodo('area')}
                style={[styles.metodoBtn, p.metodo === 'area' && styles.metodoBtnAtivo]}
              >
                <Text style={[styles.metodoText, p.metodo === 'area' && styles.metodoTextAtivo]}>Por área</Text>
              </Pressable>
            </View>
          )}

          {p.modo === 'personalizado' && (
            <View style={styles.pctLista}>
              {p.talhoes.map((t) => (
                <View key={t.id} style={styles.pctLinha}>
                  <Text style={styles.pctNome} numberOfLines={1}>
                    {t.nome}
                  </Text>
                  <View style={styles.pctInputWrap}>
                    <TextInput
                      value={p.percentuais[t.id] ?? ''}
                      onChangeText={(v) => p.onPercentual(t.id, v.replace(/[^\d,]/g, ''))}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={colors.textSoft}
                      style={styles.pctInput}
                    />
                    <Text style={styles.pctPercent}>%</Text>
                  </View>
                </View>
              ))}
              <Text style={[styles.pctSoma, Math.abs(p.somaPct - 100) > 0.5 && styles.pctSomaErro]}>
                Soma: {p.somaPct.toFixed(0)}% {Math.abs(p.somaPct - 100) > 0.5 ? '(precisa ser 100%)' : '✓'}
              </Text>
            </View>
          )}

          {p.modo !== 'geral' && p.alocacoes.length > 0 && (
            <View style={styles.preview}>
              {p.alocacoes.map((a) => (
                <View key={a.talhaoId} style={styles.previewLinha}>
                  <Text style={styles.previewNome} numberOfLines={1}>
                    {p.nomePorId[a.talhaoId] ?? 'Talhão'}
                  </Text>
                  <Text style={styles.previewValor}>
                    {formatBrlCent(a.valor)} · {a.percentual.toFixed(0)}%
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
}

function TipoBotao({ label, ativo, corAtiva, onPress }: { label: string; ativo: boolean; corAtiva: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: ativo }}
      style={[styles.tipoBtn, ativo && { backgroundColor: corAtiva, borderColor: corAtiva }]}
    >
      <Text style={[styles.tipoText, ativo && styles.tipoTextAtivo]}>{label}</Text>
    </Pressable>
  );
}

function formatBrlCent(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
}

function hojeIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(10, 30, 20, 0.55)', zIndex: 300 },
  centro: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 400 },
  card: { width: '100%', maxWidth: 480, maxHeight: '92%', backgroundColor: colors.surface, borderRadius: radius.lg, ...shadows.card },
  cardConteudo: { padding: 24, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titulo: { color: colors.text, fontSize: 19, fontWeight: '700' },
  fechar: { color: colors.textMuted, fontSize: 26, fontWeight: '700', lineHeight: 26 },
  tipoSwitch: { flexDirection: 'row', gap: 8 },
  tipoBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipoText: { color: colors.textMuted, fontSize: 15, fontWeight: '700' },
  tipoTextAtivo: { color: colors.surface },
  bloco: { gap: 10 },
  label: { color: colors.text, fontSize: 14, fontWeight: '700' },
  dica: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  modos: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  modoPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
  },
  modoPillAtivo: { borderColor: colors.primary, backgroundColor: colors.primary },
  modoText: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  modoTextAtivo: { color: colors.surface },
  talhaoPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  talhaoPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  talhaoPillAtivo: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  talhaoText: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  talhaoTextAtivo: { color: colors.primary },
  metodoSwitch: { flexDirection: 'row', gap: 8 },
  metodoBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metodoBtnAtivo: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  metodoText: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
  metodoTextAtivo: { color: colors.primary },
  pctLista: { gap: 8 },
  pctLinha: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pctNome: { flex: 1, color: colors.text, fontSize: 14 },
  pctInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: 10,
  },
  pctInput: { minWidth: 48, height: 38, color: colors.text, fontSize: 14, textAlign: 'right' },
  pctPercent: { color: colors.textMuted, fontSize: 14, marginLeft: 2 },
  pctSoma: { color: colors.textMuted, fontSize: 12, fontWeight: '700', textAlign: 'right' },
  pctSomaErro: { color: colors.danger },
  preview: {
    gap: 4,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.sm,
    padding: 12,
  },
  previewLinha: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  previewNome: { flex: 1, color: colors.textMuted, fontSize: 13 },
  previewValor: { color: colors.text, fontSize: 13, fontWeight: '700' },
  erro: { color: colors.danger, fontSize: 13 },
  acoes: { flexDirection: 'row', gap: 12, marginTop: 4 },
  acaoBtn: { flex: 1 },
});
