import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { MapaLocalizacao } from '@/components/MapaLocalizacao';
import { Toast, type ToastTipo } from '@/components/Toast';
import { PageScaffold } from '@/screens/dashboard/components/PageScaffold';
import {
  atualizarEmail,
  atualizarLocalizacao,
  atualizarPerfil,
  atualizarSenha,
} from '@/services/auth.service';
import {
  lerPreferencias,
  salvarPreferencias,
  type Preferencias,
} from '@/services/preferencias.service';
import { maskDecimal, parseDecimal } from '@/utils/masks';
import { colors, radius, shadows } from '@/theme/colors';
import { Cultura, Usuario } from '@/screens/auth/cadastro/types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

      <SegurancaCard />

      <NotificacoesCard usuario={usuario} />
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
  const [email, setEmail] = useState(usuario.email);
  const [area, setArea] = useState(usuario.areaTotal ?? '');
  const [cultura, setCultura] = useState<Cultura | null>(usuario.culturas[0] ?? null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [toast, setToast] = useState<{ tipo: ToastTipo; mensagem: string } | null>(null);

  function cancelar() {
    setNome(usuario.nome);
    setEmail(usuario.email);
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
    const novoEmail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(novoEmail)) {
      setErro('Informe um e-mail válido.');
      return;
    }
    const areaNum = parseDecimal(area);

    setSalvando(true);
    try {
      if (novoEmail !== usuario.email) await atualizarEmail(novoEmail);
      await atualizarPerfil({
        nome,
        fazendaId: usuario.fazendaId,
        areaTotal: Number.isFinite(areaNum) && areaNum > 0 ? areaNum : undefined,
        cultura: cultura ?? undefined,
      });
      onUsuarioAtualizado?.({
        ...usuario,
        nome: nome.trim(),
        email: novoEmail,
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

          <Input
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="voce@email.com"
          />

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

function SegurancaCard() {
  const [aberto, setAberto] = useState(false);
  const [senha, setSenha] = useState('');
  const [confirma, setConfirma] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [toast, setToast] = useState<{ tipo: ToastTipo; mensagem: string } | null>(null);

  function fechar() {
    setAberto(false);
    setSenha('');
    setConfirma('');
    setErro(null);
  }

  async function salvar() {
    setErro(null);
    if (senha.length < 6) {
      setErro('A senha precisa ter ao menos 6 caracteres.');
      return;
    }
    if (senha !== confirma) {
      setErro('As senhas não conferem.');
      return;
    }
    setSalvando(true);
    try {
      await atualizarSenha(senha);
      setToast({ tipo: 'sucesso', mensagem: 'Senha atualizada! 🔒' });
      fechar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitulo}>Segurança</Text>
        {!aberto ? (
          <Pressable
            onPress={() => setAberto(true)}
            style={({ pressed }) => [styles.editarBtn, pressed && styles.pressed]}
          >
            <Feather name="lock" size={14} color={colors.primary} />
            <Text style={styles.editarText}>Trocar senha</Text>
          </Pressable>
        ) : null}
      </View>

      {aberto ? (
        <View style={styles.form}>
          <Input
            label="Nova senha"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            placeholder="mínimo 6 caracteres"
          />
          <Input
            label="Confirmar nova senha"
            value={confirma}
            onChangeText={setConfirma}
            secureTextEntry
            placeholder="repita a senha"
          />
          {erro ? <Text style={styles.erro}>{erro}</Text> : null}
          <View style={styles.acoes}>
            <Button title="Cancelar" variant="secondary" onPress={fechar} style={styles.acaoBtn} />
            <Button title="Salvar senha" onPress={salvar} loading={salvando} style={styles.acaoBtn} />
          </View>
        </View>
      ) : (
        <Text style={styles.cardSub}>Atualize sua senha de acesso quando quiser.</Text>
      )}

      {toast ? <Toast tipo={toast.tipo} mensagem={toast.mensagem} onClose={() => setToast(null)} /> : null}
    </View>
  );
}

function NotificacoesCard({ usuario }: { usuario: Usuario }) {
  const [prefs, setPrefs] = useState<Preferencias>(() => lerPreferencias(usuario.email));

  function toggle(chave: keyof Preferencias) {
    const novo = { ...prefs, [chave]: !prefs[chave] };
    setPrefs(novo);
    salvarPreferencias(usuario.email, novo);
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitulo}>Notificações</Text>
      <LinhaSwitch
        label="Alertas de preço"
        descricao="Quando um preço-alvo é atingido"
        valor={prefs.alertasPreco}
        onToggle={() => toggle('alertasPreco')}
      />
      <LinhaSwitch
        label="Clima e pulverização"
        descricao="Previsão de chuva e janelas de aplicação"
        valor={prefs.clima}
        onToggle={() => toggle('clima')}
      />
      <LinhaSwitch
        label="Mercado e cotações"
        descricao="Altas e quedas relevantes das commodities"
        valor={prefs.mercado}
        onToggle={() => toggle('mercado')}
      />
      <Text style={styles.cardSubFoot}>
        As notificações push chegam quando o app estiver instalado no celular.
      </Text>
    </View>
  );
}

function LinhaSwitch({
  label,
  descricao,
  valor,
  onToggle,
}: {
  label: string;
  descricao: string;
  valor: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.switchLinha}>
      <View style={styles.switchTexto}>
        <Text style={styles.switchLabel}>{label}</Text>
        <Text style={styles.switchDesc}>{descricao}</Text>
      </View>
      <Switch
        value={valor}
        onValueChange={onToggle}
        trackColor={{ true: colors.primary, false: colors.border }}
        thumbColor={colors.surface}
      />
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
  cardSubFoot: {
    color: colors.textSoft,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  switchLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingTop: 14,
  },
  switchTexto: {
    flex: 1,
    gap: 2,
  },
  switchLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  switchDesc: {
    color: colors.textMuted,
    fontSize: 13,
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
