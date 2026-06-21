import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { criarAlerta, type Condicao } from '@/services/alertas.service';
import { buscarCotacoes, type Cotacao } from '@/services/cotacoes.service';
import { maskMoeda, parseMoeda } from '@/utils/masks';
import { colors, radius, shadows } from '@/theme/colors';

type AlertaFormModalProps = {
  onFechar: () => void;
  onSalvo: () => void;
};

export function AlertaFormModal({ onFechar, onSalvo }: AlertaFormModalProps) {
  const [cotacoes, setCotacoes] = useState<Cotacao[] | null>(null);
  const [selecionada, setSelecionada] = useState<Cotacao | null>(null);
  const [condicao, setCondicao] = useState<Condicao>('acima');
  const [alvo, setAlvo] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    buscarCotacoes().then((dados) => {
      if (!ativo) return;
      setCotacoes(dados);
      setSelecionada(dados[0] ?? null);
    });
    return () => {
      ativo = false;
    };
  }, []);

  async function salvar() {
    setErro(null);
    if (!selecionada) {
      setErro('Escolha uma commodity.');
      return;
    }
    const alvoNum = parseMoeda(alvo);
    if (!Number.isFinite(alvoNum) || alvoNum <= 0) {
      setErro('Informe um preço-alvo válido maior que zero.');
      return;
    }

    setSalvando(true);
    try {
      await criarAlerta({
        commodityId: selecionada.id,
        commodityNome: selecionada.nome,
        condicao,
        alvo: alvoNum,
      });
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
              <Text style={styles.titulo}>Novo alerta de preço</Text>
              <Pressable onPress={onFechar} hitSlop={10} accessibilityLabel="Fechar">
                <Text style={styles.fechar}>×</Text>
              </Pressable>
            </View>

            {cotacoes === null ? (
              <View style={styles.estado}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              <>
                <View style={styles.bloco}>
                  <Text style={styles.label}>Commodity</Text>
                  <View style={styles.commodities}>
                    {cotacoes.map((c) => {
                      const ativa = selecionada?.id === c.id;
                      return (
                        <Pressable
                          key={c.id}
                          onPress={() => setSelecionada(c)}
                          style={[styles.commodityPill, ativa && styles.commodityPillAtiva]}
                        >
                          <View style={[styles.dot, { backgroundColor: c.cor }]} />
                          <Text style={[styles.commodityText, ativa && styles.commodityTextAtiva]}>
                            {c.nome}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {selecionada ? (
                    <Text style={styles.precoAtual}>
                      Preço atual: {formatBrl(selecionada.preco)} ({selecionada.unidade})
                    </Text>
                  ) : null}
                </View>

                <View style={styles.bloco}>
                  <Text style={styles.label}>Avisar quando o preço ficar</Text>
                  <View style={styles.condicaoSwitch}>
                    <CondicaoBotao
                      label="Acima do alvo"
                      ativo={condicao === 'acima'}
                      onPress={() => setCondicao('acima')}
                    />
                    <CondicaoBotao
                      label="Abaixo do alvo"
                      ativo={condicao === 'abaixo'}
                      onPress={() => setCondicao('abaixo')}
                    />
                  </View>
                </View>

                <Input
                  label="Preço-alvo (R$)"
                  value={alvo}
                  onChangeText={(t) => setAlvo(maskMoeda(t))}
                  keyboardType="numeric"
                  placeholder="0,00"
                />

                {erro ? <Text style={styles.erro}>{erro}</Text> : null}

                <View style={styles.acoes}>
                  <Button title="Cancelar" variant="secondary" onPress={onFechar} style={styles.acaoBtn} />
                  <Button title="Criar alerta" onPress={salvar} loading={salvando} style={styles.acaoBtn} />
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </>
  );
}

function CondicaoBotao({ label, ativo, onPress }: { label: string; ativo: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: ativo }}
      style={[styles.condicaoBtn, ativo && styles.condicaoBtnAtivo]}
    >
      <Text style={[styles.condicaoText, ativo && styles.condicaoTextAtivo]}>{label}</Text>
    </Pressable>
  );
}

function formatBrl(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10, 30, 20, 0.55)',
    zIndex: 300,
  },
  centro: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 400,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '90%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadows.card,
  },
  cardConteudo: {
    padding: 24,
    gap: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titulo: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '700',
  },
  fechar: {
    color: colors.textMuted,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 26,
  },
  estado: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloco: {
    gap: 8,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  commodities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  commodityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
  },
  commodityPillAtiva: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  commodityText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  commodityTextAtiva: {
    color: colors.primary,
  },
  precoAtual: {
    color: colors.textMuted,
    fontSize: 13,
  },
  condicaoSwitch: {
    flexDirection: 'row',
    gap: 8,
  },
  condicaoBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  condicaoBtnAtivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  condicaoText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  condicaoTextAtivo: {
    color: colors.surface,
  },
  erro: {
    color: colors.danger,
    fontSize: 13,
  },
  acoes: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  acaoBtn: {
    flex: 1,
  },
});
