import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

type PageScaffoldProps = {
  titulo: string;
  subtitulo?: string;
  desktop: boolean;
  /** Conteúdo opcional alinhado à direita do cabeçalho (filtros, botões). */
  headerRight?: ReactNode;
  children: ReactNode;
};

/**
 * Esqueleto comum de toda página interna do app: scroll + respiro lateral
 * responsivo + cabeçalho (título/subtítulo). Mantém o espaçamento idêntico
 * em todas as telas para não termos cada página inventando o próprio padding.
 */
export function PageScaffold({ titulo, subtitulo, desktop, headerRight, children }: PageScaffoldProps) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.scroll, !desktop && styles.scrollMobile]}
    >
      <View style={styles.topbar}>
        <View style={styles.topbarTexto}>
          <Text style={[styles.titulo, !desktop && styles.tituloMobile]}>{titulo}</Text>
          {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
        </View>
        {headerRight ? <View>{headerRight}</View> : null}
      </View>

      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 28,
    gap: 22,
    paddingBottom: 64,
  },
  scrollMobile: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
  },
  topbarTexto: {
    gap: 4,
    flexShrink: 1,
  },
  titulo: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '700',
  },
  tituloMobile: {
    fontSize: 21,
  },
  subtitulo: {
    color: colors.textMuted,
    fontSize: 15,
  },
});
