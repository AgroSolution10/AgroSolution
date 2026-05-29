import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/theme/colors';

export type Periodo = 'mes' | 'mesPassado' | 'trimestre' | 'ano';

const OPCOES: { id: Periodo; label: string }[] = [
  { id: 'mes', label: 'Este mês' },
  { id: 'mesPassado', label: 'Mês passado' },
  { id: 'trimestre', label: 'Trimestre' },
  { id: 'ano', label: 'Ano' },
];

type FiltrosPeriodoProps = {
  valor: Periodo;
  onChange: (p: Periodo) => void;
};

export function FiltrosPeriodo({ valor, onChange }: FiltrosPeriodoProps) {
  return (
    <View style={styles.barra}>
      {OPCOES.map((op) => {
        const ativo = op.id === valor;
        return (
          <Pressable
            key={op.id}
            onPress={() => onChange(op.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: ativo }}
            style={({ pressed }) => [
              styles.pill,
              ativo && styles.pillAtivo,
              pressed && !ativo && styles.pillPressed,
            ]}
          >
            <Text style={[styles.texto, ativo && styles.textoAtivo]}>{op.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 5,
    alignSelf: 'flex-start',
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  pillAtivo: {
    backgroundColor: colors.primary,
  },
  pillPressed: {
    backgroundColor: colors.surfaceSoft,
  },
  texto: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  textoAtivo: {
    color: colors.surface,
  },
});
