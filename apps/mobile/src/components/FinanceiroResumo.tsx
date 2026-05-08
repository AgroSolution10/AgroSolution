import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

export function FinanceiroResumo() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Resumo financeiro</Text>
        <Text style={styles.periodo}>Maio · 2026</Text>
      </View>

      <View style={styles.principal}>
        <Text style={styles.principalLabel}>Lucro líquido do mês</Text>
        <Text style={styles.principalValor}>R$ 184.520,00</Text>
        <View style={styles.variacao}>
          <Text style={styles.variacaoText}>▲ 12,4%</Text>
          <Text style={styles.variacaoSub}>vs. abril</Text>
        </View>
      </View>

      <View style={styles.linhas}>
        <Linha label="Receita" valor="R$ 412.000" cor={colors.success} />
        <Linha label="Custos" valor="R$ 227.480" cor={colors.danger} />
      </View>
    </View>
  );
}

function Linha({ label, valor, cor }: { label: string; valor: string; cor: string }) {
  return (
    <View style={styles.linha}>
      <View style={styles.linhaTopo}>
        <View style={[styles.linhaDot, { backgroundColor: cor }]} />
        <Text style={styles.linhaLabel}>{label}</Text>
      </View>
      <Text style={styles.linhaValor}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 24,
    gap: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  periodo: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  principal: {
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: 10,
    gap: 4,
  },
  principalLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
  },
  principalValor: {
    color: colors.surface,
    fontSize: 28,
    fontWeight: '900',
  },
  variacao: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 6,
  },
  variacaoText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '900',
  },
  variacaoSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  linhas: {
    flexDirection: 'row',
    gap: 12,
  },
  linha: {
    flex: 1,
    padding: 14,
    backgroundColor: colors.surfaceSoft,
    borderRadius: 8,
    gap: 4,
  },
  linhaTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  linhaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  linhaLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  linhaValor: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
});
