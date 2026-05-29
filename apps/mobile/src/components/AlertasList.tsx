import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows } from '@/theme/colors';

type TipoAlerta = 'sucesso' | 'aviso' | 'critico';

type Alerta = {
  tipo: TipoAlerta;
  titulo: string;
  texto: string;
  quando: string;
};

const ALERTAS: Alerta[] = [
  {
    tipo: 'sucesso',
    titulo: 'Soja em alta',
    texto: 'Preço subiu 2,3% essa semana. Janela favorável para vender 30% da safra.',
    quando: 'há 2 horas',
  },
  {
    tipo: 'aviso',
    titulo: 'Chuva prevista',
    texto: 'Próximas 72h com 25mm de chuva acumulada. Adie a pulverização.',
    quando: 'há 5 horas',
  },
  {
    tipo: 'critico',
    titulo: 'Adubo subindo',
    texto: 'Custo do MAP subiu 8% essa semana. Considere antecipar a compra.',
    quando: 'há 1 dia',
  },
];

const CORES_FUNDO: Record<TipoAlerta, string> = {
  sucesso: colors.successSoft,
  aviso: colors.warningSoft,
  critico: colors.dangerSoft,
};

const CORES_BORDA: Record<TipoAlerta, string> = {
  sucesso: colors.success,
  aviso: colors.accent,
  critico: colors.danger,
};

export function AlertasList() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Alertas inteligentes</Text>
        <View style={styles.contador}>
          <Text style={styles.contadorText}>{ALERTAS.length}</Text>
        </View>
      </View>
      <View style={styles.lista}>
        {ALERTAS.map((alerta, i) => (
          <ItemAlerta key={i} {...alerta} />
        ))}
      </View>
    </View>
  );
}

function ItemAlerta({ tipo, titulo, texto, quando }: Alerta) {
  return (
    <View
      style={[
        styles.item,
        { backgroundColor: CORES_FUNDO[tipo], borderLeftColor: CORES_BORDA[tipo] },
      ]}
    >
      <View style={[styles.bullet, { backgroundColor: CORES_BORDA[tipo] }]} />
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{titulo}</Text>
        <Text style={styles.itemText}>{texto}</Text>
        <Text style={styles.itemQuando}>{quando}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 24,
    gap: 16,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  contador: {
    backgroundColor: colors.primarySoft,
    minWidth: 26,
    height: 24,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contadorText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  lista: {
    gap: 10,
  },
  item: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    borderLeftWidth: 3,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  itemContent: {
    flex: 1,
    gap: 3,
  },
  itemTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  itemText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  itemQuando: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
});
