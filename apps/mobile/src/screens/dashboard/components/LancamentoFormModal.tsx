import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import {
  atualizarLancamento,
  criarLancamento,
  type LancamentoItem,
  type TipoLancamento,
} from '@/services/financeiro.service';
import { formatMoeda, maskMoeda, parseMoeda } from '@/utils/masks';
import { colors, radius, shadows } from '@/theme/colors';

type LancamentoFormModalProps = {
  /** Quando presente, o modal entra em modo edição. Ausente = novo lançamento. */
  lancamento?: LancamentoItem | null;
  onFechar: () => void;
  /** Chamado após salvar com sucesso (parent recarrega os cards). */
  onSalvo: () => void;
};

export function LancamentoFormModal({ lancamento, onFechar, onSalvo }: LancamentoFormModalProps) {
  const editando = Boolean(lancamento);

  const [tipo, setTipo] = useState<TipoLancamento>(lancamento?.tipo ?? 'receita');
  const [valor, setValor] = useState(lancamento ? formatMoeda(lancamento.valor) : '');
  const [descricao, setDescricao] = useState(lancamento?.descricao ?? '');
  const [data, setData] = useState(lancamento?.data ?? hojeIso());
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    setErro(null);

    const valorNum = parseMoeda(valor);
    if (!Number.isFinite(valorNum) || valorNum <= 0) {
      setErro('Informe um valor válido maior que zero.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      setErro('A data precisa estar no formato AAAA-MM-DD.');
      return;
    }

    const dados = {
      tipo,
      valor: valorNum,
      descricao,
      categoria: tipo === 'receita' ? 'venda' : 'custo',
      data,
    };

    setSalvando(true);
    try {
      if (lancamento) {
        await atualizarLancamento(lancamento.id, dados);
      } else {
        await criarLancamento(dados);
      }
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
              <TipoBotao
                label="Receita"
                ativo={tipo === 'receita'}
                corAtiva={colors.success}
                onPress={() => setTipo('receita')}
              />
              <TipoBotao
                label="Despesa"
                ativo={tipo === 'despesa'}
                corAtiva={colors.danger}
                onPress={() => setTipo('despesa')}
              />
            </View>

            <Input
              label="Valor (R$)"
              value={valor}
              onChangeText={(t) => setValor(maskMoeda(t))}
              keyboardType="numeric"
              placeholder="0,00"
            />
            <Input
              label="Descrição (opcional)"
              value={descricao}
              onChangeText={setDescricao}
              placeholder={tipo === 'receita' ? 'Ex.: Venda de soja' : 'Ex.: Compra de fertilizante'}
            />
            <Input
              label="Data"
              value={data}
              onChangeText={setData}
              placeholder="AAAA-MM-DD"
              autoCapitalize="none"
            />

            {erro ? <Text style={styles.erro}>{erro}</Text> : null}

            <View style={styles.acoes}>
              <Button title="Cancelar" variant="secondary" onPress={onFechar} style={styles.acaoBtn} />
              <Button
                title={editando ? 'Salvar alterações' : 'Salvar'}
                onPress={salvar}
                loading={salvando}
                style={styles.acaoBtn}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </>
  );
}

function TipoBotao({
  label,
  ativo,
  corAtiva,
  onPress,
}: {
  label: string;
  ativo: boolean;
  corAtiva: string;
  onPress: () => void;
}) {
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

function hojeIso(): string {
  return new Date().toISOString().slice(0, 10);
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
    maxWidth: 440,
    maxHeight: '90%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadows.card,
  },
  cardConteudo: {
    padding: 24,
    gap: 16,
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
  tipoSwitch: {
    flexDirection: 'row',
    gap: 8,
  },
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
  tipoText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '700',
  },
  tipoTextAtivo: {
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
