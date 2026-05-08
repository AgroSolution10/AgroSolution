import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

type SidePanelProps = {
  compact?: boolean;
};

const fieldImage = {
  uri: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=80',
};

export function SidePanel({ compact = false }: SidePanelProps) {
  return (
    <ImageBackground
      source={fieldImage}
      resizeMode="cover"
      style={[styles.container, compact && styles.compactContainer]}
      imageStyle={styles.image}
    >
      <View style={styles.overlay} />
      <View style={[styles.content, compact && styles.compactContent]}>
        <View style={styles.brandRow}>
          <View style={styles.logoMark}>
            <Text style={styles.logoSymbol}>✓</Text>
          </View>
          <Text style={styles.brand}>AgroSolution</Text>
        </View>

        <View style={[styles.copy, compact && styles.compactCopy]}>
          <Text style={[styles.title, compact && styles.compactTitle]}>
            Gestão Proativa para o Seu Agronegócio
          </Text>
          <Text style={[styles.subtitle, compact && styles.compactSubtitle]}>
            Monitore clima, produção e commodities em poucos toques.
          </Text>
        </View>

        {!compact && (
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>10k+</Text>
              <Text style={styles.statLabel}>Produtores</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>2M ha</Text>
              <Text style={styles.statLabel}>Monitorados</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>98%</Text>
              <Text style={styles.statLabel}>Satisfação</Text>
            </View>
          </View>
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 720,
  },
  compactContainer: {
    minHeight: 210,
    maxHeight: 240,
    width: '100%',
  },
  image: {
    opacity: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 53, 33, 0.76)',
  },
  content: {
    flex: 1,
    padding: 48,
    justifyContent: 'space-between',
  },
  compactContent: {
    padding: 22,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSymbol: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '900',
  },
  brand: {
    color: colors.surface,
    fontSize: 24,
    fontWeight: '900',
  },
  copy: {
    gap: 14,
  },
  compactCopy: {
    gap: 8,
  },
  title: {
    color: colors.surface,
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '900',
    maxWidth: 720,
  },
  compactTitle: {
    fontSize: 24,
    lineHeight: 30,
  },
  subtitle: {
    color: colors.surface,
    fontSize: 19,
    lineHeight: 30,
    maxWidth: 700,
  },
  compactSubtitle: {
    fontSize: 15,
    lineHeight: 21,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    maxWidth: 620,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 120,
    gap: 6,
  },
  statValue: {
    color: colors.surface,
    fontSize: 26,
    fontWeight: '900',
  },
  statLabel: {
    color: colors.surface,
    fontSize: 14,
  },
});
