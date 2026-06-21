import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { PageScaffold } from '@/screens/dashboard/components/PageScaffold';
import { coordsDoUsuario } from '@/screens/dashboard/pages/DashboardHome';
import { EXEMPLOS_COMANDOS, interpretarComando } from '@/services/voz.service';
import { colors, radius, shadows } from '@/theme/colors';
import { Usuario } from '@/screens/auth/cadastro/types';

type VozScreenProps = {
  desktop: boolean;
  usuario: Usuario;
};

type Troca = { pergunta: string; resposta: string };

// API de reconhecimento de voz do navegador (Chrome). Tipagem mínima.
function getReconhecimento(): any {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function VozScreen({ desktop, usuario }: VozScreenProps) {
  const [ouvindo, setOuvindo] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [historico, setHistorico] = useState<Troca[]>([]);
  const [falarResposta, setFalarResposta] = useState(true);
  const recognitionRef = useRef<any>(null);

  const ctx = { coords: coordsDoUsuario(usuario), fazendaId: usuario.fazendaId };
  const RecognitionClass = getReconhecimento();
  const vozDisponivel = Boolean(RecognitionClass);

  const processar = useCallback(
    async (frase: string) => {
      if (!frase.trim()) return;
      setProcessando(true);
      const resposta = await interpretarComando(frase, ctx);
      setHistorico((h) => [...h, { pergunta: frase, resposta }]);
      setProcessando(false);
      if (falarResposta) falar(resposta);
    },
    // ctx é derivado de usuario; recomputa quando muda
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [usuario.latitude, usuario.longitude, usuario.fazendaId, falarResposta],
  );

  function ouvir() {
    if (!RecognitionClass || ouvindo) return;
    const rec = new RecognitionClass();
    rec.lang = 'pt-BR';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const texto = e.results?.[0]?.[0]?.transcript ?? '';
      processar(texto);
    };
    rec.onend = () => setOuvindo(false);
    rec.onerror = () => setOuvindo(false);
    recognitionRef.current = rec;
    setOuvindo(true);
    rec.start();
  }

  return (
    <PageScaffold
      desktop={desktop}
      titulo="Comando de Voz"
      subtitulo="Pergunte por voz sobre cotações, financeiro, clima e alertas."
      headerRight={
        <Pressable
          onPress={() => setFalarResposta((v) => !v)}
          style={({ pressed }) => [styles.somBtn, pressed && styles.pressed]}
          accessibilityLabel="Alternar leitura em voz"
        >
          <Feather name={falarResposta ? 'volume-2' : 'volume-x'} size={16} color={colors.primary} />
          <Text style={styles.somBtnText}>{falarResposta ? 'Voz ligada' : 'Voz desligada'}</Text>
        </Pressable>
      }
    >
      <View style={styles.card}>
        <View style={styles.micWrap}>
          <Pressable
            onPress={ouvir}
            disabled={!vozDisponivel || ouvindo || processando}
            style={({ pressed }) => [
              styles.mic,
              ouvindo && styles.micOuvindo,
              (!vozDisponivel || processando) && styles.micDesativado,
              pressed && styles.pressed,
            ]}
            accessibilityLabel="Falar"
          >
            {processando ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Feather name="mic" size={30} color={colors.surface} />
            )}
          </Pressable>
          <Text style={styles.micLabel}>
            {!vozDisponivel
              ? 'Microfone disponível no Chrome (web). Use os exemplos abaixo.'
              : ouvindo
                ? 'Ouvindo… pode falar'
                : processando
                  ? 'Processando…'
                  : 'Toque no microfone e fale'}
          </Text>
        </View>

        <Text style={styles.exemplosLabel}>Experimente {vozDisponivel ? '(ou toque para simular)' : ''}:</Text>
        <View style={styles.exemplos}>
          {EXEMPLOS_COMANDOS.map((ex) => (
            <Pressable
              key={ex}
              onPress={() => processar(ex)}
              disabled={processando}
              style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
            >
              <Text style={styles.chipText}>{ex}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {historico.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.conversaTitulo}>Conversa</Text>
          <View style={styles.conversa}>
            {historico.map((tr, i) => (
              <View key={i} style={styles.troca}>
                <View style={styles.balaoPergunta}>
                  <Text style={styles.perguntaText}>{tr.pergunta}</Text>
                </View>
                <View style={styles.balaoResposta}>
                  <Feather name="zap" size={14} color={colors.primary} style={{ marginTop: 2 }} />
                  <Text style={styles.respostaText}>{tr.resposta}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </PageScaffold>
  );
}

/** Lê a resposta em voz alta (web). */
function falar(texto: string) {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(texto);
  u.lang = 'pt-BR';
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

const styles = StyleSheet.create({
  somBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radius.sm,
  },
  somBtnText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  pressed: {
    opacity: 0.85,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 24,
    gap: 16,
    ...shadows.card,
  },
  micWrap: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  mic: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  micOuvindo: {
    backgroundColor: colors.danger,
  },
  micDesativado: {
    backgroundColor: colors.primaryMuted,
  },
  micLabel: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 360,
  },
  exemplosLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  exemplos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  conversaTitulo: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  conversa: {
    gap: 16,
  },
  troca: {
    gap: 8,
  },
  balaoPergunta: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    borderTopRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  perguntaText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  balaoResposta: {
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'flex-start',
    maxWidth: '90%',
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    borderTopLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  respostaText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
});
