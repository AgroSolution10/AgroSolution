import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { MapaLocalizacao } from '@/components/MapaLocalizacao';
import { Toast, type ToastTipo } from '@/components/Toast';
import { EmConstrucao } from '@/screens/dashboard/components/EmConstrucao';
import { PageScaffold } from '@/screens/dashboard/components/PageScaffold';
import { atualizarLocalizacao } from '@/services/auth.service';
import { colors, radius, shadows } from '@/theme/colors';
import { Usuario } from '@/screens/auth/cadastro/types';

type ConfiguracoesScreenProps = {
  desktop: boolean;
  usuario: Usuario;
  /** Atualiza o usuário no app após salvar (ex.: nova coordenada). */
  onUsuarioAtualizado?: (u: Usuario) => void;
};

const ROTULO_CULTURA: Record<string, string> = {
  soja: 'Soja',
  milho: 'Milho',
  algodao: 'Algodão',
  pecuaria: 'Pecuária',
};

/**
 * Configurações / Meu perfil. Exibe os dados do usuário e permite editar a
 * localização da fazenda (que alimenta os alertas de clima). Demais edições
 * (nome, e-mail, senha) ficam para depois.
 */
export function ConfiguracoesScreen({ desktop, usuario, onUsuarioAtualizado }: ConfiguracoesScreenProps) {
  const culturas = (usuario.culturas ?? []).map((c) => ROTULO_CULTURA[c] ?? c).join(', ');

  return (
    <PageScaffold
      desktop={desktop}
      titulo="Configurações"
      subtitulo="Seus dados, sua fazenda e as preferências do app."
    >
      <View style={styles.card}>
        <Text style={styles.cardTitulo}>Meu perfil</Text>
        <Campo rotulo="Nome" valor={usuario.nome} />
        <Campo rotulo="E-mail" valor={usuario.email} />
        <Campo rotulo="Culturas" valor={culturas || '—'} />
        <Campo
          rotulo="Área total"
          valor={usuario.areaTotal ? `${usuario.areaTotal} ha` : '—'}
        />
      </View>

      <LocalizacaoEditor usuario={usuario} onUsuarioAtualizado={onUsuarioAtualizado} />

      <EmConstrucao
        icon="settings"
        titulo="Mais edições em breve"
        descricao="Por enquanto você já pode ajustar a localização da fazenda. Edição de nome, e-mail e senha vêm a seguir."
        itens={['Editar nome e e-mail', 'Trocar senha', 'Preferências de notificação']}
      />
    </PageScaffold>
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
  aviso: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
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
