import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { buscarCotacoes, type Cotacao } from '@/services/cotacoes.service';
import { colors, radius, shadows } from '@/theme/colors';

export function RadarCommodities() {
  const [cotacoes, setCotacoes] = useState<Cotacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(false);
    try {
      const dados = await buscarCotacoes();
      setCotacoes(dados);
    } catch {
      setErro(true);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTexto}>
          <Text style={styles.title}>Radar de Commodities</Text>
          <Text style={styles.subtitle}>
            {carregando ? 'Atualizando cotações…' : 'Dólar em tempo real · demais em breve'}
          </Text>
        </View>
        <Pressable
          onPress={carregar}
          hitSlop={8}
          accessibilityLabel="Atualizar cotações"
          style={({ pressed }) => [styles.atualizar, pressed && styles.atualizarPressed]}
        >
          <Feather name="refresh-cw" size={15} color={colors.primary} />
        </Pressable>
      </View>

      {erro ? (
        <View style={styles.estado}>
          <Text style={styles.estadoText}>Não foi possível carregar as cotações.</Text>
          <Pressable onPress={carregar} style={styles.tentar}>
            <Text style={styles.tentarText}>Tentar de novo</Text>
          </Pressable>
        </View>
      ) : carregando && cotacoes.length === 0 ? (
        <View style={styles.estado}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <View style={styles.grid}>
          {cotacoes.map((c) => (
            <CardCommodity key={c.id} cotacao={c} />
          ))}
        </View>
      )}
    </View>
  );
}

function CardCommodity({ cotacao }: { cotacao: Cotacao }) {
  const { nome, unidade, preco, variacao, cor } = cotacao;
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
  headerTexto: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  atualizar: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  atualizarPressed: {
    opacity: 0.7,
  },
  estado: {
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  estadoText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  tentar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  tentarText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '700',
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
    fontWeight: '700',
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
