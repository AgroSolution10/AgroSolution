import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

export type ToastTipo = 'sucesso' | 'erro' | 'info';

type ToastProps = {
  tipo: ToastTipo;
  mensagem: string;
  onClose: () => void;
  duracaoMs?: number;
};

const CORES: Record<ToastTipo, { fundo: string; borda: string; texto: string }> = {
  sucesso: { fundo: '#E6F4EC', borda: colors.success, texto: colors.success },
  erro: { fundo: '#FEE9E7', borda: colors.danger, texto: colors.danger },
  info: { fundo: '#EAF1FB', borda: '#3B82F6', texto: '#1E40AF' },
};

const ICONES: Record<ToastTipo, string> = {
  sucesso: '✓',
  erro: '⚠',
  info: 'i',
};

export function Toast({ tipo, mensagem, onClose, duracaoMs = 4000 }: ToastProps) {
  useEffect(() => {
    const id = setTimeout(onClose, duracaoMs);
    return () => clearTimeout(id);
  }, [onClose, duracaoMs]);

  const cor = CORES[tipo];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: cor.fundo, borderLeftColor: cor.borda },
      ]}
      accessibilityRole="alert"
    >
      <Text style={[styles.icone, { color: cor.borda }]}>{ICONES[tipo]}</Text>
      <Text style={[styles.mensagem, { color: cor.texto }]}>{mensagem}</Text>
      <Pressable onPress={onClose} hitSlop={10} style={styles.fecharBtn}>
        <Text style={styles.fechar}>×</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    maxWidth: 460,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderLeftWidth: 4,
    zIndex: 1000,
    elevation: 6,
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.12)' },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
    }),
  },
  icone: {
    fontSize: 18,
    fontWeight: '900',
  },
  mensagem: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  fecharBtn: {
    paddingHorizontal: 4,
  },
  fechar: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textMuted,
  },
});
