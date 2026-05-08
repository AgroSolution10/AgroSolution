import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

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
        <Text style={styles.nome}>{nome}</Text>
      </View>
      <Text style={styles.preco}>{formatBrl(preco)}</Text>
      <Text style={styles.unidade}>{unidade}</Text>
      <View style={[styles.variacao, subindo ? styles.variacaoUp : styles.variacaoDown]}>
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
    borderRadius: 12,
    padding: 24,
    gap: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
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
    backgroundColor: '#FEE9E7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
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
    fontWeight: '900',
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
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    gap: 4,
    backgroundColor: colors.surfaceSoft,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  iconePequeno: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nome: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  preco: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  unidade: {
    color: colors.textSoft,
    fontSize: 11,
    marginBottom: 6,
  },
  variacao: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  variacaoUp: { backgroundColor: '#E6F4EC' },
  variacaoDown: { backgroundColor: '#FEE9E7' },
  variacaoText: {
    fontSize: 12,
    fontWeight: '900',
  },
  variacaoUpText: { color: colors.success },
  variacaoDownText: { color: colors.danger },
});
