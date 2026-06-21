import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MapaTalhoes, type PontoTalhao } from '@/components/MapaTalhoes';
import { Toast, type ToastTipo } from '@/components/Toast';
import { PageScaffold } from '@/screens/dashboard/components/PageScaffold';
import { TalhaoFormModal } from '@/screens/dashboard/components/TalhaoFormModal';
import { excluirTalhao, listarTalhoes, type Talhao } from '@/services/talhoes.service';
import { colors, radius, shadows } from '@/theme/colors';
import { Usuario } from '@/screens/auth/cadastro/types';

type TalhoesScreenProps = {
  desktop: boolean;
  usuario: Usuario;
};

const ROTULO_CULTURA: Record<string, string> = {
  soja: 'Soja',
  milho: 'Milho',
  algodao: 'Algodão',
  pecuaria: 'Pecuária',
};

/**
 * Talhões — áreas produtivas da fazenda. Lista os talhões, mostra os pinos no
 * mapa e permite criar/excluir. Cada talhão tem nome, cultura, área e ponto.
 */
export function TalhoesScreen({ desktop, usuario }: TalhoesScreenProps) {
  const fazendaId = usuario.fazendaId;
  const [talhoes, setTalhoes] = useState<Talhao[] | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ tipo: ToastTipo; mensagem: string } | null>(null);

  const recarregar = useCallback(() => {
    if (!fazendaId) {
      setTalhoes([]);
      return;
    }
    setTalhoes(null);
    setConfirmandoId(null);
    listarTalhoes(fazendaId).then(setTalhoes);
  }, [fazendaId]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  function aoSalvar() {
    setModalAberto(false);
    recarregar();
    setToast({ tipo: 'sucesso', mensagem: 'Talhão adicionado! 🗺️' });
  }

  async function aoExcluir(id: string) {
    try {
      await excluirTalhao(id);
      recarregar();
      setToast({ tipo: 'info', mensagem: 'Talhão removido.' });
    } catch (e) {
      setToast({ tipo: 'erro', mensagem: e instanceof Error ? e.message : 'Não foi possível remover.' });
    }
  }

  const pontos: PontoTalhao[] = (talhoes ?? [])
    .filter((t) => t.latitude != null && t.longitude != null)
    .map((t) => ({ id: t.id, nome: t.nome, latitude: t.latitude as number, longitude: t.longitude as number }));

  const areaTotal = (talhoes ?? []).reduce((acc, t) => acc + (t.areaHa ?? 0), 0);
  const fazendaCoord =
    usuario.latitude != null && usuario.longitude != null
      ? { latitude: usuario.latitude, longitude: usuario.longitude }
      : undefined;

  return (
    <>
      <PageScaffold
        desktop={desktop}
        titulo="Talhões"
        subtitulo="Mapeie e gerencie as áreas produtivas da sua fazenda."
        headerRight={
          fazendaId ? (
            <Pressable
              onPress={() => setModalAberto(true)}
              style={({ pressed }) => [styles.novoBtn, pressed && styles.novoBtnPressed]}
              accessibilityLabel="Novo talhão"
            >
              <Feather name="plus" size={18} color={colors.surface} />
              <Text style={styles.novoBtnText}>Novo talhão</Text>
            </Pressable>
          ) : undefined
        }
      >
        {!fazendaId ? (
          <View style={styles.card}>
            <Text style={styles.vazio}>
              Você ainda não tem uma fazenda cadastrada. Finalize o cadastro com cultura e área para
              gerenciar os talhões.
            </Text>
          </View>
        ) : talhoes === null ? (
          <View style={[styles.card, styles.estado]}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <>
            <View style={styles.resumo}>
              <Indicador valor={String(talhoes.length)} rotulo={talhoes.length === 1 ? 'talhão' : 'talhões'} />
              <Indicador valor={`${areaTotal.toLocaleString('pt-BR')} ha`} rotulo="área mapeada" />
            </View>

            {fazendaCoord || pontos.length > 0 ? (
              <MapaTalhoes pontos={pontos} fazenda={fazendaCoord} />
            ) : null}

            <View style={styles.card}>
              <Text style={styles.cardTitulo}>Meus talhões</Text>
              {talhoes.length === 0 ? (
                <View style={styles.estado}>
                  <Text style={styles.vazio}>
                    Nenhum talhão ainda. Toque em “Novo talhão” para mapear a primeira área.
                  </Text>
                </View>
              ) : (
                <View style={styles.lista}>
                  {talhoes.map((t) => (
                    <ItemTalhao
                      key={t.id}
                      talhao={t}
                      confirmando={confirmandoId === t.id}
                      onPedirExcluir={() => setConfirmandoId(t.id)}
                      onCancelar={() => setConfirmandoId(null)}
                      onConfirmar={() => {
                        setConfirmandoId(null);
                        aoExcluir(t.id);
                      }}
                    />
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </PageScaffold>

      {modalAberto && fazendaId && (
        <TalhaoFormModal
          fazendaId={fazendaId}
          fazendaCoord={fazendaCoord}
          onFechar={() => setModalAberto(false)}
          onSalvo={aoSalvar}
        />
      )}

      {toast ? <Toast tipo={toast.tipo} mensagem={toast.mensagem} onClose={() => setToast(null)} /> : null}
    </>
  );
}

function Indicador({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <View style={styles.indicador}>
      <Text style={styles.indicadorValor}>{valor}</Text>
      <Text style={styles.indicadorRotulo}>{rotulo}</Text>
    </View>
  );
}

type ItemProps = {
  talhao: Talhao;
  confirmando: boolean;
  onPedirExcluir: () => void;
  onCancelar: () => void;
  onConfirmar: () => void;
};

function ItemTalhao({ talhao, confirmando, onPedirExcluir, onCancelar, onConfirmar }: ItemProps) {
  const detalhes = [
    talhao.cultura ? ROTULO_CULTURA[talhao.cultura] ?? talhao.cultura : null,
    talhao.areaHa != null ? `${talhao.areaHa.toLocaleString('pt-BR')} ha` : null,
    talhao.latitude != null ? '📍 no mapa' : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.item}>
      <View style={styles.itemTexto}>
        <Text style={styles.itemTitulo}>{talhao.nome}</Text>
        <Text style={styles.itemDetalhe}>{detalhes || 'Sem detalhes'}</Text>
      </View>

      {confirmando ? (
        <View style={styles.confirmar}>
          <Text style={styles.confirmarText}>Excluir?</Text>
          <Pressable onPress={onConfirmar} hitSlop={8} style={[styles.confirmarBtn, styles.confirmarSim]}>
            <Feather name="check" size={16} color={colors.surface} />
          </Pressable>
          <Pressable onPress={onCancelar} hitSlop={8} style={[styles.confirmarBtn, styles.confirmarNao]}>
            <Feather name="x" size={16} color={colors.textMuted} />
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={onPedirExcluir} hitSlop={8} style={styles.lixeira} accessibilityLabel="Excluir talhão">
          <Feather name="trash-2" size={16} color={colors.textSoft} />
        </Pressable>
      )}
    </View>
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
  resumo: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  indicador: {
    flexGrow: 1,
    flexBasis: 160,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 20,
    gap: 2,
    ...shadows.card,
  },
  indicadorValor: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '800',
  },
  indicadorRotulo: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 24,
    gap: 16,
    ...shadows.card,
  },
  cardTitulo: {
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
    gap: 12,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  itemTexto: {
    flex: 1,
    gap: 2,
  },
  itemTitulo: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  itemDetalhe: {
    color: colors.textMuted,
    fontSize: 13,
  },
  lixeira: {
    width: 32,
    height: 32,
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
