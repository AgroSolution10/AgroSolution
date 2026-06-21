import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { type FiltroPeriodo } from '@/components/FiltrosPeriodo';
import { listarLancamentos, type LancamentoItem } from '@/services/financeiro.service';
import { colors, radius, shadows } from '@/theme/colors';

const FILTRO_PADRAO: FiltroPeriodo = { periodo: 'mes' };

type LancamentosRecentesProps = {
  /** Filtro a aplicar (mesmo controle do resumo). */
  filtro?: FiltroPeriodo;
  /** Muda este valor para recarregar a lista (ex.: após novo lançamento). */
  refreshKey?: number;
  onEditar: (item: LancamentoItem) => void;
  onExcluir: (item: LancamentoItem) => void;
};

export function LancamentosRecentes({
  filtro = FILTRO_PADRAO,
  refreshKey = 0,
  onEditar,
  onExcluir,
}: LancamentosRecentesProps) {
  const [itens, setItens] = useState<LancamentoItem[] | null>(null);
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const chaveFiltro = `${filtro.periodo}:${filtro.inicio ?? ''}:${filtro.fim ?? ''}`;

  useEffect(() => {
    let ativo = true;
    setConfirmandoId(null);
    setItens(null);
    listarLancamentos(filtro).then((dados) => {
      if (ativo) setItens(dados);
    });
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveFiltro, refreshKey]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lançamentos do período</Text>

      {itens === null ? (
        <View style={styles.estado}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : itens.length === 0 ? (
        <View style={styles.estado}>
          <Text style={styles.vazio}>Nenhum lançamento neste período. Toque em “Novo lançamento” para adicionar.</Text>
        </View>
      ) : (
        <View style={styles.lista}>
          {itens.map((item) => (
            <ItemLancamento
              key={item.id}
              item={item}
              confirmando={confirmandoId === item.id}
              onEditar={() => onEditar(item)}
              onPedirExcluir={() => setConfirmandoId(item.id)}
              onCancelarExcluir={() => setConfirmandoId(null)}
              onConfirmarExcluir={() => {
                setConfirmandoId(null);
                onExcluir(item);
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}

type ItemProps = {
  item: LancamentoItem;
  confirmando: boolean;
  onEditar: () => void;
  onPedirExcluir: () => void;
  onCancelarExcluir: () => void;
  onConfirmarExcluir: () => void;
};

function ItemLancamento({
  item,
  confirmando,
  onEditar,
  onPedirExcluir,
  onCancelarExcluir,
  onConfirmarExcluir,
}: ItemProps) {
  const receita = item.tipo === 'receita';

  return (
    <View style={styles.item}>
      <Pressable
        style={styles.itemAlvo}
        onPress={onEditar}
        accessibilityRole="button"
        accessibilityLabel={`Editar ${item.descricao || (receita ? 'receita' : 'despesa')}`}
      >
        <View style={[styles.bolinha, { backgroundColor: receita ? colors.success : colors.danger }]} />
        <View style={styles.itemTexto}>
          <Text style={styles.itemTitulo} numberOfLines={1}>
            {item.descricao || (receita ? 'Receita' : 'Despesa')}
          </Text>
          <Text style={styles.itemData}>{formatData(item.data)}</Text>
        </View>
        <Text style={[styles.itemValor, { color: receita ? colors.success : colors.danger }]}>
          {receita ? '+' : '−'} {formatBrl(item.valor)}
        </Text>
      </Pressable>

      {confirmando ? (
        <View style={styles.confirmar}>
          <Text style={styles.confirmarText}>Excluir?</Text>
          <Pressable onPress={onConfirmarExcluir} hitSlop={8} style={[styles.confirmarBtn, styles.confirmarSim]}>
            <Feather name="check" size={16} color={colors.surface} />
          </Pressable>
          <Pressable onPress={onCancelarExcluir} hitSlop={8} style={[styles.confirmarBtn, styles.confirmarNao]}>
            <Feather name="x" size={16} color={colors.textMuted} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={onPedirExcluir}
          hitSlop={8}
          style={styles.lixeira}
          accessibilityLabel="Excluir lançamento"
        >
          <Feather name="trash-2" size={16} color={colors.textSoft} />
        </Pressable>
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

function formatData(iso: string) {
  // 'YYYY-MM-DD' → 'DD/MM/AAAA'
  const [ano, mes, dia] = iso.split('-');
  if (!ano || !mes || !dia) return iso;
  return `${dia}/${mes}/${ano}`;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 24,
    gap: 16,
    ...shadows.card,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  estado: {
    minHeight: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  vazio: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  lista: {
    gap: 0,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  itemAlvo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  bolinha: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  itemTexto: {
    flex: 1,
    gap: 2,
  },
  itemTitulo: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  itemData: {
    color: colors.textSoft,
    fontSize: 12,
  },
  itemValor: {
    fontSize: 15,
    fontWeight: '800',
  },
  lixeira: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confirmarText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  confirmarBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmarSim: {
    backgroundColor: colors.danger,
  },
  confirmarNao: {
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
