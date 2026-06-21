import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { MapaLocalizacao } from '@/components/MapaLocalizacao';
import { Toast, type ToastTipo } from '@/components/Toast';
import { EmConstrucao } from '@/screens/dashboard/components/EmConstrucao';
import { PageScaffold } from '@/screens/dashboard/components/PageScaffold';
import { atualizarLocalizacao, atualizarPerfil } from '@/services/auth.service';
import { maskDecimal, parseDecimal } from '@/utils/masks';
import { colors, radius, shadows } from '@/theme/colors';
import { Cultura, Usuario } from '@/screens/auth/cadastro/types';

type ConfiguracoesScreenProps = {
  desktop: boolean;
  usuario: Usuario;
  /** Atualiza o usuário no app após salvar (perfil ou localização). */
  onUsuarioAtualizado?: (u: Usuario) => void;
};

const CULTURAS: { id: Cultura; label: string }[] = [
  { id: 'soja', label: 'Soja' },
  { id: 'milho', label: 'Milho' },
  { id: 'algodao', label: 'Algodão' },
  { id: 'pecuaria', label: 'Pecuária' },
];

const ROTULO_CULTURA: Record<string, string> = Object.fromEntries(
  CULTURAS.map((c) => [c.id, c.label]),
);

export function ConfiguracoesScreen({ desktop, usuario, onUsuarioAtualizado }: ConfiguracoesScreenProps) {
  return (
    <PageScaffold
      desktop={desktop}
      titulo="Configurações"
      subtitulo="Seus dados, sua fazenda e as preferências do app."
    >
      <PerfilEditor usuario={usuario} onUsuarioAtualizado={onUsuarioAtualizado} />

      <LocalizacaoEditor usuario={usuario} onUsuarioAtualizado={onUsuarioAtualizado} />

      <EmConstrucao
        icon="settings"
        titulo="Mais opções em breve"
        descricao="Você já pode editar seu perfil e a localização. Troca de e-mail e senha vêm a seguir."
        itens={['Trocar e-mail (com confirmação)', 'Trocar senha', 'Preferências de notificação']}
      />
    </PageScaffold>
  );
}

function PerfilEditor({
  usuario,
  onUsuarioAtualizado,
}: {
  usuario: Usuario;
  onUsuarioAtualizado?: (u: Usuario) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(usuario.nome);
  const [area, setArea] = useState(usuario.areaTotal ?? '');
  const [cultura, setCultura] = useState<Cultura | null>(usuario.culturas[0] ?? null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [toast, setToast] = useState<{ tipo: ToastTipo; mensagem: string } | null>(null);

  function cancelar() {
    setNome(usuario.nome);
    setArea(usuario.areaTotal ?? '');
    setCultura(usuario.culturas[0] ?? null);
    setErro(null);
    setEditando(false);
  }

  async function salvar() {
    setErro(null);
    if (nome.trim().length < 2) {
      setErro('O nome precisa ter ao menos 2 caracteres.');
      return;
    }
    const areaNum = parseDecimal(area);

    setSalvando(true);
    try {
      await atualizarPerfil({
        nome,
        fazendaId: usuario.fazendaId,
        areaTotal: Number.isFinite(areaNum) && areaNum > 0 ? areaNum : undefined,
        cultura: cultura ?? undefined,
      });
      onUsuarioAtualizado?.({
        ...usuario,
        nome: nome.trim(),
        areaTotal: Number.isFinite(areaNum) && areaNum > 0 ? area : usuario.areaTotal,
        culturas: cultura ? [cultura] : usuario.culturas,
      });
      setToast({ tipo: 'sucesso', mensagem: 'Perfil atualizado! ✅' });
      setEditando(false);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitulo}>Meu perfil</Text>
        {!editando ? (
          <Pressable
            onPress={() => setEditando(true)}
            style={({ pressed }) => [styles.editarBtn, pressed && styles.pressed]}
          >
            <Feather name="edit-2" size={14} color={colors.primary} />
            <Text style={styles.editarText}>Editar</Text>
          </Pressable>
        ) : null}
      </View>

      {!editando ? (
        <>
          <Campo rotulo="Nome" valor={usuario.nome} />
          <Campo rotulo="E-mail" valor={usuario.email} />
          <Campo
            rotulo="Cultura principal"
            valor={usuario.culturas[0] ? ROTULO_CULTURA[usuario.culturas[0]] ?? usuario.culturas[0] : '—'}
          />
          <Campo rotulo="Área total" valor={usuario.areaTotal ? `${usuario.areaTotal} ha` : '—'} />
        </>
      ) : (
        <View style={styles.form}>
          <Input label="Nome" value={nome} onChangeText={setNome} placeholder="Seu nome" />

          <View style={styles.bloco}>
            <Text style={styles.label}>E-mail</Text>
            <View style={styles.emailLock}>
              <Text style={styles.emailText}>{usuario.email}</Text>
              <Feather name="lock" size={14} color={colors.textSoft} />
            </View>
            <Text style={styles.dica}>A troca de e-mail exige confirmação — em breve.</Text>
          </View>

          {usuario.fazendaId ? (
            <>
              <View style={styles.bloco}>
                <Text style={styles.label}>Cultura principal</Text>
                <View style={styles.culturas}>
                  {CULTURAS.map((c) => {
                    const ativa = cultura === c.id;
                    return (
                      <Pressable
                        key={c.id}
                        onPress={() => setCultura(ativa ? null : c.id)}
                        style={[styles.culturaPill, ativa && styles.culturaPillAtiva]}
                      >
                        <Text style={[styles.culturaText, ativa && styles.culturaTextAtiva]}>{c.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Input
                label="Área total (ha)"
                value={area}
                onChangeText={(t) => setArea(maskDecimal(t))}
                keyboardType="numeric"
                placeholder="Ex.: 150,5"
              />
            </>
          ) : null}

          {erro ? <Text style={styles.erro}>{erro}</Text> : null}

          <View style={styles.acoes}>
            <Button title="Cancelar" variant="secondary" onPress={cancelar} style={styles.acaoBtn} />
            <Button title="Salvar" onPress={salvar} loading={salvando} style={styles.acaoBtn} />
          </View>
        </View>
      )}

      {toast ? (
        <Toast tipo={toast.tipo} mensagem={toast.mensagem} onClose={() => setToast(null)} />
      ) : null}
    </View>
  );
}

function LocalizacaoEditor({
  usuario,
  onUsuarioAtualizado,
}: {
  usuario: Usuario;
  onUsuarioAtualizado?: (u: Usuario) => void;
}) {
  const [latitude, setLatitude] = useState(usuario.latitude?.toString() ?? '');
  const [longitude, setLongitude] = useState(usuario.longitude?.toString() ?? '');
  const [salvando, setSalvando] = useState(false);
  const [toast, setToast] = useState<{ tipo: ToastTipo; mensagem: string } | null>(null);

  const lat = parseFloat(latitude.replace(',', '.'));
  const lng = parseFloat(longitude.replace(',', '.'));
  const temCoord = Number.isFinite(lat) && Number.isFinite(lng);
  const semFazenda = !usuario.fazendaId;

  async function salvar() {
    if (!usuario.fazendaId || !temCoord) return;
    setSalvando(true);
    try {
      await atualizarLocalizacao(usuario.fazendaId, lat, lng);
      onUsuarioAtualizado?.({ ...usuario, latitude: lat, longitude: lng });
      setToast({ tipo: 'sucesso', mensagem: 'Localização salva! Alertas de clima ativados. 🌦️' });
    } catch (e) {
      setToast({ tipo: 'erro', mensagem: e instanceof Error ? e.message : 'Não foi possível salvar.' });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitulo}>Localização da fazenda</Text>
      <Text style={styles.cardSub}>
        Usada para os alertas de clima (previsão de chuva). Clique no mapa ou busque um endereço.
      </Text>

      {semFazenda ? (
        <Text style={styles.aviso}>
          Você ainda não tem uma fazenda cadastrada — finalize o cadastro com cultura e área para
          poder definir a localização.
        </Text>
      ) : (
        <>
          <MapaLocalizacao
            latitude={latitude}
            longitude={longitude}
            onChange={(la, lo) => {
              setLatitude(la);
              setLongitude(lo);
            }}
          />
          <Button
            title={temCoord ? 'Salvar localização' : 'Marque um ponto no mapa'}
            onPress={salvar}
            loading={salvando}
            disabled={!temCoord}
          />
        </>
      )}

      {toast ? (
        <Toast tipo={toast.tipo} mensagem={toast.mensagem} onClose={() => setToast(null)} />
      ) : null}
    </View>
  );
}

function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={styles.campo}>
      <Text style={styles.campoRotulo}>{rotulo}</Text>
      <Text style={styles.campoValor}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 24,
    gap: 16,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitulo: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  cardSub: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: -6,
  },
  editarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editarText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
  aviso: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  form: {
    gap: 16,
  },
  bloco: {
    gap: 8,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  emailLock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  emailText: {
    color: colors.textMuted,
    fontSize: 15,
  },
  dica: {
    color: colors.textSoft,
    fontSize: 12,
  },
  culturas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  culturaPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
  },
  culturaPillAtiva: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  culturaText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  culturaTextAtiva: {
    color: colors.primary,
  },
  erro: {
    color: colors.danger,
    fontSize: 13,
  },
  acoes: {
    flexDirection: 'row',
    gap: 12,
  },
  acaoBtn: {
    flex: 1,
  },
  campo: {
    gap: 2,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingTop: 12,
  },
  campoRotulo: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  campoValor: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
