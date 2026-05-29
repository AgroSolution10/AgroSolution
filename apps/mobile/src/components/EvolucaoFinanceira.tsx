import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { colors, radius, shadows } from '@/theme/colors';

type Ponto = { mes: string; receita: number; despesa: number };

// Dados mockados — últimos 6 meses. Substituir pelo serviço financeiro depois.
const DADOS: Ponto[] = [
  { mes: 'Dez', receita: 38000, despesa: 22000 },
  { mes: 'Jan', receita: 45000, despesa: 28000 },
  { mes: 'Fev', receita: 41000, despesa: 31000 },
  { mes: 'Mar', receita: 60000, despesa: 35000 },
  { mes: 'Abr', receita: 67000, despesa: 39000 },
  { mes: 'Mai', receita: 52000, despesa: 41000 },
];

const ALTURA = 200;
const PAD_TOP = 12;
const PAD_BOTTOM = 26;
const N_LINHAS = 4;

export function EvolucaoFinanceira() {
  const [largura, setLargura] = useState(0);

  function aoMedir(e: LayoutChangeEvent) {
    setLargura(e.nativeEvent.layout.width);
  }

  const max = Math.max(...DADOS.flatMap((d) => [d.receita, d.despesa]));
  const chartH = ALTURA - PAD_TOP - PAD_BOTTOM;
  const slot = largura / DADOS.length;
  const barW = Math.min(16, slot / 3.2);
  const escala = (v: number) => (v / max) * chartH;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Evolução Financeira</Text>
          <Text style={styles.subtitle}>Últimos 6 meses · Receitas vs. Despesas</Text>
        </View>
      </View>

      <View onLayout={aoMedir} style={styles.chartWrap}>
        {largura > 0 && (
          <Svg width={largura} height={ALTURA}>
            {/* Linhas de grade horizontais */}
            <G>
              {Array.from({ length: N_LINHAS + 1 }).map((_, i) => {
                const y = PAD_TOP + (chartH / N_LINHAS) * i;
                return (
                  <Line
                    key={i}
                    x1={0}
                    y1={y}
                    x2={largura}
                    y2={y}
                    stroke={colors.borderSoft}
                    strokeWidth={1}
                  />
                );
              })}
            </G>

            {/* Barras agrupadas (receita / despesa) */}
            {DADOS.map((d, i) => {
              const centro = slot * i + slot / 2;
              const hRec = escala(d.receita);
              const hDes = escala(d.despesa);
              const baseY = PAD_TOP + chartH;
              return (
                <G key={d.mes}>
                  <Rect
                    x={centro - barW - 3}
                    y={baseY - hRec}
                    width={barW}
                    height={hRec}
                    rx={4}
                    fill={colors.primary}
                  />
                  <Rect
                    x={centro + 3}
                    y={baseY - hDes}
                    width={barW}
                    height={hDes}
                    rx={4}
                    fill={colors.danger}
                  />
                  <SvgText
                    x={centro}
                    y={ALTURA - 8}
                    fontSize={11}
                    fontWeight="600"
                    fill={colors.textMuted}
                    textAnchor="middle"
                  >
                    {d.mes}
                  </SvgText>
                </G>
              );
            })}
          </Svg>
        )}
      </View>

      <View style={styles.legenda}>
        <ItemLegenda cor={colors.primary} label="Receitas" />
        <ItemLegenda cor={colors.danger} label="Despesas" />
      </View>
    </View>
  );
}

function ItemLegenda({ cor, label }: { cor: string; label: string }) {
  return (
    <View style={styles.legendaItem}>
      <View style={[styles.legendaDot, { backgroundColor: cor }]} />
      <Text style={styles.legendaText}>{label}</Text>
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
    gap: 2,
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
  chartWrap: {
    width: '100%',
    height: ALTURA,
  },
  legenda: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  legendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendaDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendaText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
});
