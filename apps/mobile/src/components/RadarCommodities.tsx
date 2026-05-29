import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows } from '@/theme/colors';

type Commodity = {
  nome: string;
  unidade: string;
  preco: number;
  variacao: number;
  cor: string;
};

// Dados mockados — substituir por chamada ao serviço de cotações depois.
const COMMODITIES: Commodity[] = [
  { nome: 'Soja', unidade: 'R$ / saca 60kg', preco: 142.5, variacao: 2.3, cor: '#A3D977' },
  { nome: 'Milho', unidade: 'R$ / saca 60kg', preco: 78.9, variacao: -0.8, cor: '#FFC107' },
  { nome: 'Algodão', unidade: 'R$ / arroba', preco: 158.2, variacao: 1.1, cor: '#F0F0F0' },
  { nome: 'Boi gordo', unidade: 'R$ / arroba', preco: 240.5, variacao: 0.5, cor: '#C49A6C' },
  { nome: 'Café arábica', unidade: 'R$ / saca 60kg', preco: 1845, variacao: 3.7, cor: '#6F4E37' },
  { nome: 'Dólar', unidade: 'R$ / USD', preco: 5.18, variacao: -0.4, cor: '#3B82F6' },
];

export function RadarCommodities() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Radar de Commodities</Text>
          <Text style={styles.subtitle}>Cotações em tempo real · atualizado há 5 min</Text>
        </View>
        <View style={styles.aoVivo}>
          <View style={styles.dot} />
          <Text style={styles.aoVivoText}>AO VIVO</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {COMMODITIES.map((c) => (
          <CardCommodity key={c.nome} {...c} />
        ))}
      </View>
    </View>
  );
}

function CardCommodity({ nome, unidade, preco, variacao, cor }: Commodity) {
  const subindo = variacao >= 0;
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.iconePequeno, { backgroundColor: cor }]} />
        <Text style={styles.nome} numberOfLines={1}>
          {nome}
        </Text>
      </View>
      <Text style={styles.preco}>{formatBrl(preco)}</Text>
      <View style={styles.rodape}>
        <Text style={styles.unidade} numberOfLines={1}>
          {unidade}
        </Text>
        <Text style={[styles.variacaoText, subindo ? styles.variacaoUpText : styles.variacaoDownText]}>
          {subindo ? '▲' : '▼'} {Math.abs(variacao).toFixed(1)}%
        </Text>
      </View>
    </View>
  );
}

function formatBrl(valor: number) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 24,
    gap: 20,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  aoVivo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.dangerSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  aoVivoText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    flexGrow: 1,
    flexBasis: 180,
    borderRadius: radius.md,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.surfaceSoft,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  iconePequeno: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
  },
  nome: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  preco: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '800',
  },
  rodape: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 6,
  },
  unidade: {
    color: colors.textSoft,
    fontSize: 11,
    flexShrink: 1,
  },
  variacaoText: {
    fontSize: 12,
    fontWeight: '800',
  },
  variacaoUpText: { color: colors.success },
  variacaoDownText: { color: colors.danger },
});
