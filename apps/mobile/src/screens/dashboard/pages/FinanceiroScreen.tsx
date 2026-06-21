import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { EvolucaoFinanceira } from '@/components/EvolucaoFinanceira';
import { FinanceiroResumo } from '@/components/FinanceiroResumo';
import { FiltrosPeriodo, type FiltroPeriodo } from '@/components/FiltrosPeriodo';
import { ProjecaoCaixa } from '@/components/ProjecaoCaixa';
import { Toast, type ToastTipo } from '@/components/Toast';
import { LancamentoFormModal } from '@/screens/dashboard/components/LancamentoFormModal';
import { LancamentosRecentes } from '@/screens/dashboard/components/LancamentosRecentes';
import { PageScaffold } from '@/screens/dashboard/components/PageScaffold';
import { excluirLancamento, type LancamentoItem } from '@/services/financeiro.service';
import { colors, radius } from '@/theme/colors';

type FinanceiroScreenProps = {
  desktop: boolean;
};

/**
 * Financeiro — administração do produtor. Resumo, evolução e lançamentos
 * recentes vêm da tabela `lancamento` (Supabase). Dá para criar, editar e
 * excluir lançamentos; ao mudar, os cards recarregam via refreshKey.
 */
export function FinanceiroScreen({ desktop }: FinanceiroScreenProps) {
  // null = fechado; 'novo' = criar; objeto = editar aquele lançamento.
  const [modal, setModal] = useState<'novo' | LancamentoItem | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filtro, setFiltro] = useState<FiltroPeriodo>({ periodo: 'mes' });
  const [toast, setToast] = useState<{ tipo: ToastTipo; mensagem: string } | null>(null);

  function recarregar() {
    setRefreshKey((k) => k + 1);
  }

  function aoSalvar() {
    const editando = modal !== 'novo';
    setModal(null);
    recarregar();
    setToast({
      tipo: 'sucesso',
      mensagem: editando ? 'Lançamento atualizado! ✅' : 'Lançamento adicionado! 💰',
    });
  }

  async function aoExcluir(item: LancamentoItem) {
    try {
      await excluirLancamento(item.id);
      recarregar();
      setToast({ tipo: 'info', mensagem: 'Lançamento excluído.' });
    } catch (e) {
      setToast({
        tipo: 'erro',
        mensagem: e instanceof Error ? e.message : 'Não foi possível excluir.',
      });
    }
  }

  return (
    <>
      <PageScaffold
        desktop={desktop}
        titulo="Financeiro"
        subtitulo="Receitas, custos e a saúde financeira da sua fazenda em um só lugar."
        headerRight={
          <Pressable
            onPress={() => setModal('novo')}
            style={({ pressed }) => [styles.novoBtn, pressed && styles.novoBtnPressed]}
            accessibilityLabel="Novo lançamento"
          >
            <Feather name="plus" size={18} color={colors.surface} />
            <Text style={styles.novoBtnText}>Novo lançamento</Text>
          </Pressable>
        }
      >
        <FiltrosPeriodo valor={filtro} onChange={setFiltro} />

        <View style={styles.colunas}>
          <View style={styles.coluna}>
            <FinanceiroResumo filtro={filtro} refreshKey={refreshKey} />
          </View>
          <View style={styles.coluna}>
            <EvolucaoFinanceira refreshKey={refreshKey} />
          </View>
        </View>

        <LancamentosRecentes
          filtro={filtro}
          refreshKey={refreshKey}
          onEditar={(item) => setModal(item)}
          onExcluir={aoExcluir}
        />

        <ProjecaoCaixa refreshKey={refreshKey} />
      </PageScaffold>

      {modal !== null && (
        <LancamentoFormModal
          lancamento={modal === 'novo' ? null : modal}
          onFechar={() => setModal(null)}
          onSalvo={aoSalvar}
        />
      )}

      {toast ? (
        <Toast tipo={toast.tipo} mensagem={toast.mensagem} onClose={() => setToast(null)} />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  novoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: radius.sm,
  },
  novoBtnPressed: {
    opacity: 0.85,
  },
  novoBtnText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 14,
  },
  colunas: {
    flexDirection: 'row',
    gap: 22,
    flexWrap: 'wrap',
  },
  coluna: {
    flexGrow: 1,
    flexBasis: 320,
  },
});
