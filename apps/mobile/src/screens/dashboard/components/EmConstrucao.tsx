import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows } from '@/theme/colors';

type FeatherName = keyof typeof Feather.glyphMap;

type EmConstrucaoProps = {
  icon: FeatherName;
  titulo: string;
  descricao: string;
  /** Itens do "o que vem por aqui" — ajuda a alinhar expectativa do que a tela fará. */
  itens?: string[];
};

/**
 * Placeholder padrão das telas ainda não implementadas. Em vez de uma página
 * em branco, mostra o propósito da tela e o que está por vir — assim dá pra
 * navegar pelo app inteiro e entender o roadmap mesmo antes do conteúdo real.
 */
export function EmConstrucao({ icon, titulo, descricao, itens }: EmConstrucaoProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconeWrap}>
        <Feather name={icon} size={28} color={colors.primary} />
      </View>

      <View style={styles.badge}>
        <View style={styles.badgeDot} />
        <Text style={styles.badgeText}>EM CONSTRUÇÃO</Text>
      </View>

      <Text style={styles.titulo}>{titulo}</Text>
      <Text style={styles.descricao}>{descricao}</Text>

      {itens && itens.length > 0 ? (
        <View style={styles.lista}>
          {itens.map((item) => (
            <View key={item} style={styles.item}>
              <Feather name="check" size={16} color={colors.success} />
              <Text style={styles.itemText}>{item}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 32,
    gap: 14,
    alignItems: 'center',
    ...shadows.card,
  },
  iconeWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  badgeText: {
    color: colors.warning,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  titulo: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
  },
  descricao: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 460,
  },
  lista: {
    gap: 10,
    marginTop: 8,
    alignSelf: 'stretch',
    maxWidth: 460,
    width: '100%',
    alignItems: 'flex-start',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemText: {
    color: colors.text,
    fontSize: 14,
    flex: 1,
  },
});
