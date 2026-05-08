import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { Cultura } from '@/screens/auth/cadastro/types';

type CulturaCardProps = {
  icon: string;
  nome: string;
  value: Cultura;
  selecionado: boolean;
  onPress: (value: Cultura) => void;
};

export function CulturaCard({ icon, nome, value, selecionado, onPress }: CulturaCardProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selecionado }}
      onPress={() => onPress(value)}
      style={({ pressed }) => [
        styles.card,
        selecionado && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.iconCircle, selecionado && styles.iconCircleSelected]}>
        <Text style={[styles.icon, selecionado && styles.iconSelected]}>{icon}</Text>
      </View>
      <Text style={styles.name}>{nome}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 150,
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 16,
  },
  selected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primarySoft,
  },
  pressed: {
    opacity: 0.88,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0F2F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleSelected: {
    backgroundColor: colors.primary,
  },
  icon: {
    color: colors.textMuted,
    fontSize: 26,
    fontWeight: '800',
  },
  iconSelected: {
    color: colors.surface,
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
});
