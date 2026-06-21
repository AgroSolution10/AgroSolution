import { useEffect, useState } from 'react';
import { ActivityIndicator, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { buscarProjecaoCaixa, type ProjecaoCaixaData } from '@/services/financeiro.service';
import { colors, radius, shadows } from '@/theme/colors';

const ALTURA = 180;
const PAD_TOP = 16;
const PAD_BOTTOM = 16;
const PAD_X = 6;

type ProjecaoCaixaProps = {
  /** Muda este valor para recarregar (ex.: após novo lançamento). */
  refreshKey?: number;
};

export function ProjecaoCaixa({ refreshKey = 0 }: ProjecaoCaixaProps) {
  const [largura, setLargura] = useState(0);
  const [dados, setDados] = useState<ProjecaoCaixaData | null>(null);

  useEffect(() => {
    let ativo = true;
    setDados(null);
    buscarProjecaoCaixa().then((d) => {
      if (ativo) setDados(d);
    });
    return () => {
      ativo = false;
    };
  }, [refreshKey]);

  function aoMedir(e: LayoutChangeEvent) {
    setLargura(e.nativeEvent.layout.width);
  }

  const serie = dados?.serie ?? [];
  const max = Math.max(...serie, 0);
  const min = Math.min(...serie, 0);
  const span = max - min || 1;
  const chartH = ALTURA - PAD_TOP - PAD_BOTTOM;
  const larguraUtil = Math.max(largura - PAD_X * 2, 0);

  const px = (i: number) => PAD_X + (larguraUtil / Math.max(serie.length - 1, 1)) * i;
  const py = (v: number) => PAD_TOP + chartH - ((v - min) / span) * chartH;

  const linha = serie.map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i)} ${py(v)}`).join(' ');
  const area = `${linha} L ${px(serie.length - 1)} ${ALTURA - PAD_BOTTOM} L ${px(0)} ${
    ALTURA - PAD_BOTTOM
  } Z`;

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

      {!dados ? (
        <View style={[styles.chartWrap, styles.centro]}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <>
          <View onLayout={aoMedir} style={styles.chartWrap}>
            {largura > 0 && serie.length > 1 && (
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
                <Circle cx={px(serie.length - 1)} cy={py(serie[serie.length - 1])} r={4} fill={colors.primary} />
                <Circle
                  cx={px(serie.length - 1)}
                  cy={py(serie[serie.length - 1])}
                  r={8}
                  fill={colors.primary}
                  fillOpacity={0.15}
                />
              </Svg>
            )}
          </View>

          <View style={styles.rodape}>
            <Text style={styles.rodapeLabel}>Saldo projetado em 30 dias</Text>
            <Text style={styles.rodapeValor}>{formatBrl(dados.saldoFinal)}</Text>
          </View>

          {dados.exemplo ? (
            <Text style={styles.aviso}>Dados de exemplo · adicione lançamentos para projetar o real</Text>
          ) : !dados.temFuturos ? (
            <Text style={styles.aviso}>
              Sem lançamentos com data futura — projeção mantém o saldo atual.
            </Text>
          ) : null}
        </>
      )}
    </View>
  );
}

function formatBrl(valor: number) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
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
    fontSize: 17,
    fontWeight: '700',
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
  centro: {
    alignItems: 'center',
    justifyContent: 'center',
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
  aviso: {
    color: colors.textSoft,
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
