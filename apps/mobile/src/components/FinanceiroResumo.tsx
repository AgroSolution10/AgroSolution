import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { type FiltroPeriodo } from '@/components/FiltrosPeriodo';
import { buscarResumoFinanceiro, type ResumoFinanceiro } from '@/services/financeiro.service';
import { colors, radius, shadows } from '@/theme/colors';

const FILTRO_PADRAO: FiltroPeriodo = { periodo: 'mes' };

type FinanceiroResumoProps = {
  /** Filtro a resumir (padrão: mês atual). */
  filtro?: FiltroPeriodo;
  /** Muda este valor para forçar o card a recarregar (ex.: após novo lançamento). */
  refreshKey?: number;
};

export function FinanceiroResumo({ filtro = FILTRO_PADRAO, refreshKey = 0 }: FinanceiroResumoProps) {
  const [resumo, setResumo] = useState<ResumoFinanceiro | null>(null);
  // String estável para a dependência do efeito (evita refetch por nova referência).
  const chaveFiltro = `${filtro.periodo}:${filtro.inicio ?? ''}:${filtro.fim ?? ''}`;

  useEffect(() => {
    let ativo = true;
    setResumo(null);
    buscarResumoFinanceiro(filtro).then((r) => {
      if (ativo) setResumo(r);
    });
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveFiltro, refreshKey]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Resumo financeiro</Text>
        <Text style={styles.periodo}>{resumo?.mesLabel ?? '—'}</Text>
      </View>

      {!resumo ? (
        <View style={styles.estado}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <>
          <View style={styles.principal}>
            <Text style={styles.principalLabel}>Lucro líquido do mês</Text>
            <Text style={styles.principalValor}>{formatBrl(resumo.lucro)}</Text>
            {resumo.variacaoLucro !== null ? (
              <View style={styles.variacao}>
                <Text style={styles.variacaoText}>
                  {resumo.variacaoLucro >= 0 ? '▲' : '▼'} {Math.abs(resumo.variacaoLucro).toFixed(1)}%
                </Text>
                <Text style={styles.variacaoSub}>{resumo.comparacao}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.linhas}>
            <Linha label="Receita" valor={formatBrl(resumo.receita)} cor={colors.success} />
            <Linha label="Custos" valor={formatBrl(resumo.custos)} cor={colors.danger} />
          </View>

          {resumo.exemplo ? (
            <Text style={styles.exemplo}>Dados de exemplo · adicione lançamentos para ver os reais</Text>
          ) : null}
        </>
      )}
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
    gap: 18,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  periodo: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  estado: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  principal: {
    backgroundColor: colors.primary,
    padding: 20,
    borderRadius: radius.md,
    gap: 4,
  },
  principalLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
  },
  principalValor: {
    color: colors.surface,
    fontSize: 27,
    fontWeight: '700',
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
    fontWeight: '800',
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
    borderRadius: radius.md,
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
    fontWeight: '800',
  },
  exemplo: {
    color: colors.textSoft,
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
