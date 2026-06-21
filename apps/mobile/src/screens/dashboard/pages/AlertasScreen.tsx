import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AlertasList } from '@/components/AlertasList';
import { Toast, type ToastTipo } from '@/components/Toast';
import { AlertaFormModal } from '@/screens/dashboard/components/AlertaFormModal';
import { PageScaffold } from '@/screens/dashboard/components/PageScaffold';
import { coordsDoUsuario } from '@/screens/dashboard/pages/DashboardHome';
import { carregarAlertas, excluirAlerta, type AlertaComStatus } from '@/services/alertas.service';
import { colors, radius, shadows } from '@/theme/colors';
import { Usuario } from '@/screens/auth/cadastro/types';

type AlertasScreenProps = {
  desktop: boolean;
  usuario: Usuario;
};

/**
 * Alertas de preço — o produtor define um preço-alvo por commodity e o app
 * mostra quais já foram atingidos, comparando com a cotação ao vivo.
 */
export function AlertasScreen({ desktop, usuario }: AlertasScreenProps) {
  const [alertas, setAlertas] = useState<AlertaComStatus[] | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [toast, setToast] = useState<{ tipo: ToastTipo; mensagem: string } | null>(null);

  const recarregar = useCallback(() => {
    setAlertas(null);
    carregarAlertas().then(setAlertas);
  }, []);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  function aoSalvar() {
    setModalAberto(false);
    recarregar();
    setToast({ tipo: 'sucesso', mensagem: 'Alerta criado! 🔔' });
  }

  async function aoExcluir(id: string) {
    try {
      await excluirAlerta(id);
      recarregar();
      setToast({ tipo: 'info', mensagem: 'Alerta removido.' });
    } catch (e) {
      setToast({ tipo: 'erro', mensagem: e instanceof Error ? e.message : 'Não foi possível remover.' });
    }
  }

  const atingidos = alertas?.filter((a) => a.atingido).length ?? 0;

  return (
    <>
      <PageScaffold
        desktop={desktop}
        titulo="Alertas"
        subtitulo="Recomendações automáticas do mercado e do seu financeiro, mais os alvos de preço que você definir."
        headerRight={
          <Pressable
            onPress={() => setModalAberto(true)}
            style={({ pressed }) => [styles.novoBtn, pressed && styles.novoBtnPressed]}
            accessibilityLabel="Novo alerta de preço"
          >
            <Feather name="plus" size={18} color={colors.surface} />
            <Text style={styles.novoBtnText}>Novo alerta</Text>
          </Pressable>
        }
      >
        {/* Alertas gerados pelo motor de regras (mercado + financeiro + clima). */}
        <AlertasList coords={coordsDoUsuario(usuario)} />

        {atingidos > 0 ? (
          <View style={styles.banner}>
            <Feather name="bell" size={18} color={colors.success} />
            <Text style={styles.bannerText}>
              {atingidos === 1
                ? '1 alerta de preço atingido agora — confira abaixo.'
                : `${atingidos} alertas de preço atingidos agora — confira abaixo.`}
            </Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Meus alertas de preço</Text>

          {alertas === null ? (
            <View style={styles.estado}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : alertas.length === 0 ? (
            <View style={styles.estado}>
              <Text style={styles.vazio}>
                Nenhum alerta ainda. Toque em “Novo alerta” para acompanhar um preço-alvo.
              </Text>
            </View>
          ) : (
            <View style={styles.lista}>
              {alertas.map((a) => (
                <ItemAlerta key={a.id} alerta={a} onExcluir={() => aoExcluir(a.id)} />
              ))}
            </View>
          )}
        </View>
      </PageScaffold>

      {modalAberto && <AlertaFormModal onFechar={() => setModalAberto(false)} onSalvo={aoSalvar} />}

      {toast ? (
        <Toast tipo={toast.tipo} mensagem={toast.mensagem} onClose={() => setToast(null)} />
      ) : null}
    </>
  );
}

function ItemAlerta({ alerta, onExcluir }: { alerta: AlertaComStatus; onExcluir: () => void }) {
  const direcao = alerta.condicao === 'acima' ? 'subir acima de' : 'cair abaixo de';
  return (
    <View style={styles.item}>
      <View style={styles.itemEsq}>
        <Text style={styles.itemTitulo}>{alerta.commodityNome}</Text>
        <Text style={styles.itemRegra}>
          Avisar ao {direcao} {formatBrl(alerta.alvo)}
        </Text>
        <Text style={styles.itemAtual}>
          {alerta.precoAtual !== null ? `Agora: ${formatBrl(alerta.precoAtual)}` : 'Sem cotação no momento'}
        </Text>
      </View>

      <View style={styles.itemDir}>
        {alerta.atingido ? (
          <View style={[styles.badge, styles.badgeAtingido]}>
            <Feather name="bell" size={12} color={colors.success} />
            <Text style={[styles.badgeText, { color: colors.success }]}>Atingido</Text>
          </View>
        ) : (
          <View style={[styles.badge, styles.badgeMonitorando]}>
            <Feather name="clock" size={12} color={colors.textMuted} />
            <Text style={[styles.badgeText, { color: colors.textMuted }]}>Monitorando</Text>
          </View>
        )}
        <Pressable onPress={onExcluir} hitSlop={8} style={styles.lixeira} accessibilityLabel="Remover alerta">
          <Feather name="trash-2" size={16} color={colors.textSoft} />
        </Pressable>
      </View>
    </View>
  );
}

function formatBrl(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
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
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
    padding: 14,
  },
  bannerText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
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
    minHeight: 90,
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
  itemEsq: {
    flex: 1,
    gap: 2,
  },
  itemTitulo: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  itemRegra: {
    color: colors.textMuted,
    fontSize: 13,
  },
  itemAtual: {
    color: colors.textSoft,
    fontSize: 12,
    marginTop: 2,
  },
  itemDir: {
    alignItems: 'flex-end',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  badgeAtingido: {
    backgroundColor: colors.successSoft,
  },
  badgeMonitorando: {
    backgroundColor: colors.surfaceSoft,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  lixeira: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
