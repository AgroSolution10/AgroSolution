import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';
import { colors, radius, shadows } from '@/theme/colors';

// Saldo projetado (R$ mil) ao longo dos próximos 30 dias — dados mockados.
const SERIE = [27.8, 29, 28.6, 18, 15.2, 15, 16.1, 15.4];

const ALTURA = 180;
const PAD_TOP = 16;
const PAD_BOTTOM = 16;
const PAD_X = 6;

export function ProjecaoCaixa() {
  const [largura, setLargura] = useState(0);

  function aoMedir(e: LayoutChangeEvent) {
    setLargura(e.nativeEvent.layout.width);
  }

  const max = Math.max(...SERIE);
  const min = Math.min(...SERIE);
  const span = max - min || 1;
  const chartH = ALTURA - PAD_TOP - PAD_BOTTOM;
  const larguraUtil = Math.max(largura - PAD_X * 2, 0);

  const px = (i: number) => PAD_X + (larguraUtil / (SERIE.length - 1)) * i;
  const py = (v: number) => PAD_TOP + chartH - ((v - min) / span) * chartH;

  // Caminho da linha + área preenchida até a base.
  const linha = SERIE.map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i)} ${py(v)}`).join(' ');
  const area = `${linha} L ${px(SERIE.length - 1)} ${ALTURA - PAD_BOTTOM} L ${px(0)} ${
    ALTURA - PAD_BOTTOM
  } Z`;

  const ultimo = SERIE[SERIE.length - 1];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Projeção de Fluxo de Caixa</Text>
          <Text style={styles.subtitle}>Próximos 30 dias</Text>
        </View>
        <View style={styles.pillDias}>
          <Text style={styles.pillDiasText}>30 dias</Text>
        </View>
      </View>

      <View onLayout={aoMedir} style={styles.chartWrap}>
        {largura > 0 && (
          <Svg width={largura} height={ALTURA}>
            <Defs>
              <LinearGradient id="gradCaixa" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.primary} stopOpacity={0.18} />
                <Stop offset="1" stopColor={colors.primary} stopOpacity={0} />
              </LinearGradient>
            </Defs>

            <Path d={area} fill="url(#gradCaixa)" />
            <Path
              d={linha}
              fill="none"
              stroke={colors.primary}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {/* Ponto final destacado */}
            <Circle cx={px(SERIE.length - 1)} cy={py(ultimo)} r={4} fill={colors.primary} />
            <Circle
              cx={px(SERIE.length - 1)}
              cy={py(ultimo)}
              r={8}
              fill={colors.primary}
              fillOpacity={0.15}
            />
          </Svg>
        )}
      </View>

      <View style={styles.rodape}>
        <Text style={styles.rodapeLabel}>Saldo projetado em 30 dias</Text>
        <Text style={styles.rodapeValor}>R$ {ultimo.toFixed(1).replace('.', ',')} mil</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 24,
    gap: 14,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  pillDias: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  pillDiasText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  chartWrap: {
    width: '100%',
    height: ALTURA,
  },
  rodape: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingTop: 12,
  },
  rodapeLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  rodapeValor: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
});
